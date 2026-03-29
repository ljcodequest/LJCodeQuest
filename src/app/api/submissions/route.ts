import { NextRequest } from "next/server";
import { apiSuccess, handleRouteError, ApiRouteError } from "@/lib/api";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { 
  QuestionModel, 
  SubmissionModel, 
  UserModel, 
  ProgressModel, 
  TrackModel,
  CourseModel,
  CertificateModel,
  ActivityLogModel
} from "@/models";
import { calculateLevel, evaluateStreak } from "@/lib/gamification";

const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"] as const;

export async function POST(request: NextRequest) {
  try {
    const context = await requireRegisteredUser(request);
    await dbConnect();
    
    const body = await request.json();
    const { questionId, trackId, courseId, type, selectedOptions, descriptiveAnswer, codingPassed, code, language } = body;

    // 1. Validation
    if (!questionId || !trackId || !courseId || !type) {
       throw new ApiRouteError(400, "VALIDATION_ERROR", "Missing required fields (questionId, trackId, courseId, type).");
    }

    const question = await QuestionModel.findById(questionId).lean();
    const track = await TrackModel.findById(trackId).lean();
    const course = await CourseModel.findById(courseId).lean();

    if (!question || !track || !course) {
       throw new ApiRouteError(404, "NOT_FOUND", "Question, Track, or Course not found.");
    }

    // 2. Gate Checking
    const progress = await ProgressModel.findOne({ userId: context.user._id, courseId }).lean();
    if (!progress) {
       throw new ApiRouteError(403, "NOT_ENROLLED", "Must enroll in course first.");
    }

    const isAdminOrInstructor = context.role === "admin" || context.role === "instructor";

    if (!isAdminOrInstructor) {
      // Is track unlocked? (Completed tracks + Current track are unlocked)
      const isCompletedTrack = progress.completedTracks.some(id => id.toString() === trackId);
      const isCurrentTrack = progress.currentTrackId?.toString() === trackId;

      if (!isCompletedTrack && !isCurrentTrack) { throw new ApiRouteError(403, "LOCKED", "Track locked."); }

      // Question gate
      if (isCurrentTrack && !isCompletedTrack) {
        const expectedOrder = progress.currentTrackProgress?.currentQuestionOrder || 1;
        if (question.order > expectedOrder) {
          throw new ApiRouteError(403, "LOCKED", "Question locked. Please complete previous questions.");
        }
      }
    }

    // 3. Evaluate
    let isCorrect = false;
    let score = 0;
    let xpEarned = 0;

    if (type === "mcq" || type === "multi-select") {
       const correctOptions = (question.options || []).filter((o: any) => o.isCorrect).map((o: any) => o.id);
       if (Array.isArray(selectedOptions) && selectedOptions.length === correctOptions.length) {
          isCorrect = selectedOptions.every(id => correctOptions.includes(id));
       }
       if (isCorrect) {
          score = 100;
          xpEarned = question.xpReward || 10;
       }
    } else if (type === "coding") {
       // FIXME: Use Code Execution service here for server validation. Trusting client for now.
       if (codingPassed) {
          isCorrect = true;
          score = 100;
          xpEarned = question.xpReward || 50;
       }
    } else if (type === "descriptive") {
       // Descriptive questions are repurposed as auto-graded drag-and-drop fill-in-the-blanks.
       // The UI sends the comma-separated string of option IDs as `descriptiveAnswer`.
       if (descriptiveAnswer && question.sampleAnswer && descriptiveAnswer.trim() === question.sampleAnswer.trim()) {
           isCorrect = true; 
           score = 100; 
           xpEarned = question.xpReward || 30;
       } else {
           isCorrect = false;
           score = 0;
           xpEarned = 0;
       }
    }

    const reviewStatus = undefined; // Auto-graded now!

    // Prevent duplicate XP
    const existingCorrectScore = await SubmissionModel.findOne({
      userId: context.user._id, questionId, isCorrect: true
    }).lean();

    if (existingCorrectScore && isCorrect) {
       xpEarned = 0;
    }

    const attemptNumber = await SubmissionModel.countDocuments({ userId: context.user._id, questionId }) + 1;

    // 4. Record Submission
    const submission = await SubmissionModel.create({
       userId: context.user._id,
       questionId,
       trackId,
       courseId,
       type,
       selectedOptions,
       descriptiveAnswer,
       code,
       language,
       isCorrect,
       score,
       xpEarned,
       attemptNumber,
       reviewStatus
    });

    let nextQuestionOrder = question.order;
    let trackCompleted = false;
    let levelCompleted = false;
    let courseCompleted = false;

    // 5. Progression Side-effects
    if (isCorrect && !existingCorrectScore) {
       nextQuestionOrder = question.order + 1;
       
       // Add to completedQuestions
       await ProgressModel.updateOne({ _id: progress._id }, { $addToSet: { completedQuestions: questionId } });
       
       // Update Gamification
       const user = await UserModel.findByIdAndUpdate(context.user._id, { $inc: { xp: xpEarned } }, { new: true });
       if (user) {
         const newLevel = calculateLevel(user.xp);
         if (newLevel !== user.level) {
           await UserModel.updateOne({ _id: user._id }, { level: newLevel });
         }
         const streakInfo = evaluateStreak(user.streak);
         if (streakInfo.shouldUpdate) {
           await UserModel.updateOne({ _id: user._id }, { 
             "streak.current": streakInfo.newCurrent,
             "streak.longest": streakInfo.newLongest,
             "streak.lastActiveDate": new Date()
           });
         }
       }

       // Track completeness check
       const totalPublishedQ = await QuestionModel.countDocuments({ trackId, isPublished: true });
       // Check how many published questions in this track user has correct submissions for
       const completedCount = await SubmissionModel.distinct("questionId", { userId: context.user._id, trackId, isCorrect: true });
       
       if (completedCount.length >= totalPublishedQ) {
         trackCompleted = true;
         await ProgressModel.updateOne({ _id: progress._id }, { $addToSet: { completedTracks: trackId } });
         if (track.xpReward) {
           await UserModel.updateOne({ _id: context.user._id }, { $inc: { xp: track.xpReward } });
         }
         await ActivityLogModel.create({ userId: context.user._id, action: "track_complete", details: `Completed track ${trackId}` });
         
         // Level completeness check
         const tracksInDifficulty = await TrackModel.find({ courseId, difficulty: track.difficulty, isPublished: true }).select("_id").lean();
         const tracksInDifficultyIds = tracksInDifficulty.map(t => t._id.toString());
         
         // Refresh progress to get latest completed tracks
         const freshProgress = await ProgressModel.findById(progress._id).lean();
         const completedTracksStrs = freshProgress?.completedTracks.map(id => id.toString()) || [];
         
         levelCompleted = tracksInDifficultyIds.every(id => completedTracksStrs.includes(id));
         
         if (levelCompleted) {
            await ProgressModel.updateOne({ _id: progress._id }, { $addToSet: { completedLevels: track.difficulty } });
            
            // Advance to next level
            const currentDiffIdx = DIFFICULTY_ORDER.indexOf(track.difficulty as any);
            const nextDiff = currentDiffIdx >= 0 && currentDiffIdx < 2 ? DIFFICULTY_ORDER[currentDiffIdx + 1] : null;
            
            if (nextDiff) {
               const nextTrack = await TrackModel.findOne({ courseId, difficulty: nextDiff, order: 1, isPublished: true }).lean();
               if (nextTrack) {
                 await ProgressModel.updateOne({ _id: progress._id }, { 
                   currentTrackId: nextTrack._id,
                   currentTrackProgress: { trackId: nextTrack._id, currentQuestionOrder: 1, totalQuestionsInTrack: nextTrack.totalQuestions || 0 }
                 });
               }
            } else {
               courseCompleted = true;
            }
         } else {
            // Next track in same difficulty
            const nextTrack = await TrackModel.findOne({ courseId, difficulty: track.difficulty, order: track.order + 1, isPublished: true }).lean();
            if (nextTrack) {
               await ProgressModel.updateOne({ _id: progress._id }, { 
                 currentTrackId: nextTrack._id,
                 currentTrackProgress: { trackId: nextTrack._id, currentQuestionOrder: 1, totalQuestionsInTrack: nextTrack.totalQuestions || 0 }
               });
            }
         }
         
         if (courseCompleted) {
           const certId = `CERT-${Date.now().toString(36).toUpperCase()}`;
           const cert = await CertificateModel.create({
             certificateId: certId,
             userId: context.user._id,
             courseId: course._id,
             issuedAt: new Date()
           });
           await ProgressModel.updateOne({ _id: progress._id }, { isCompleted: true, completedAt: new Date(), certificateId: cert._id });
           await ActivityLogModel.create({ userId: context.user._id, action: "course_complete", details: `Completed course ${courseId}` });
         }
       } else {
         // Question advanced in same track
         await ProgressModel.updateOne({ _id: progress._id }, { 
           "currentTrackProgress.currentQuestionOrder": nextQuestionOrder
         });
       }

       // Update global percent complete
       const totalCourseQ = await QuestionModel.countDocuments({ trackId: { $in: course.tracks }, isPublished: true });
       const allCompletedQ = await SubmissionModel.distinct("questionId", { userId: context.user._id, courseId, isCorrect: true });
       const percentComplete = totalCourseQ > 0 ? (allCompletedQ.length / totalCourseQ) * 100 : 0;
       await ProgressModel.updateOne({ _id: progress._id }, { percentComplete });
    }

    // Always update lastActiveAt
    await ProgressModel.updateOne({ _id: progress._id }, { lastActiveAt: new Date() });
    await ActivityLogModel.create({ userId: context.user._id, action: "question_attempt" });

    // Fetch refreshed progress to return correctly
    const finalProgress = await ProgressModel.findById(progress._id).lean();

    return apiSuccess({
      isCorrect,
      score,
      xpEarned,
      explanation: question.explanation,
      submissionId: submission._id,
      progressUpdate: {
        trackCompleted,
        levelCompleted,
        courseCompleted,
        nextQuestionOrder,
        percentComplete: finalProgress?.percentComplete || 0
      }
    });

  } catch (error) {
    return handleRouteError(error);
  }
}
