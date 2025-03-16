import { useState, useEffect } from "react";
import { getQuizQuestions } from "../lib/quiz_gemini"; 
import { db } from "../lib/firebase"; 
import { collection, addDoc } from "firebase/firestore";
import { Loader, CheckCircle, XCircle, RefreshCw, Info, ChevronDown, ChevronUp, Zap, BookOpen, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from 'react-router-dom';

function QuizPage() {
  const location = useLocation();
  const [course, setCourse] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState({});
  const [showExplanations, setShowExplanations] = useState({});
  const [generatingAnimation, setGeneratingAnimation] = useState(false);
  const [scoringInfo, setScoringInfo] = useState("");

  useEffect(() => {
    if (location.state?.fromTutor) {
      if (location.state.course) setCourse(location.state.course);
      if (location.state.topic) setTopic(location.state.topic);
    }
  }, [location]);

  useEffect(() => {
    if (loading) {
      setGeneratingAnimation(true);
      const timer = setTimeout(() => setGeneratingAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    switch(level) {
      case "Beginner":
        setScoringInfo("Scoring: +1 point for each correct answer");
        break;
      case "Intermediate":
        setScoringInfo("Scoring: +2 points for each correct answer");
        break;
      case "Advanced":
        setScoringInfo("Scoring: +3 points for each correct answer, -1 point for wrong answers");
        break;
      default:
        setScoringInfo("");
    }
  }, [level]);

  const startQuiz = async () => {
    if (!course || !topic || !level) {
      alert("Please fill all fields before starting the quiz.");
      return;
    }

    setLoading(true);
    setQuizData([]);
    setSelectedAnswers({});
    setShowAnswers({});
    setAnsweredQuestions({});
    setShowExplanations({});
    setQuizStarted(true);

    try {
      const response = await getQuizQuestions(course, topic, level);
      console.log("API Response:", response);
      
      if (response && response.questions && Array.isArray(response.questions)) {
        // Add explanations to each question if they don't already have one
        const questionsWithExplanations = response.questions.map(question => {
          if (!question.explanation) {
            // Generate a simple explanation if none exists
            const explanation = `The correct answer is "${question.answer}". This is a key concept in ${topic} that's important to understand for ${level} level ${course}.`;
            return { ...question, explanation };
          }
          return question;
        });
        
        setQuizData(questionsWithExplanations);
      } else {
        console.error("Invalid response format:", response);
        alert("Received invalid response format from API.");
      }

      // Save quiz metadata to Firebase
      await addDoc(collection(db, "quizzes"), {
        course,
        topic,
        level,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      alert("Failed to load questions. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    // Only allow selection if this question hasn't been answered yet
    if (!answeredQuestions[questionIndex]) {
      setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: selectedOption }));
      setShowAnswers((prev) => ({ ...prev, [questionIndex]: true }));
      setAnsweredQuestions((prev) => ({ ...prev, [questionIndex]: true }));
    }
  };

  const toggleExplanation = (questionIndex) => {
    setShowExplanations((prev) => ({ 
      ...prev, 
      [questionIndex]: !prev[questionIndex] 
    }));
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setShowAnswers({});
    setAnsweredQuestions({});
    setShowExplanations({});
  };

  const generateNewQuiz = () => {
    // Keep the same parameters but generate new questions
    startQuiz();
  };

  const resetEntireQuiz = () => {
    setCourse("");
    setTopic("");
    setLevel("");
    setQuizData([]);
    setSelectedAnswers({});
    setShowAnswers({});
    setAnsweredQuestions({});
    setShowExplanations({});
    setQuizStarted(false);
  };

  const calculateScore = () => {
    if (quizData.length === 0) return { correct: 0, total: 0, percentage: 0, points: 0 };
    
    let correct = 0;
    let points = 0;
    
    Object.keys(selectedAnswers).forEach(index => {
      const isCorrect = selectedAnswers[index] === quizData[index].answer;
      if (isCorrect) {
        correct++;
        switch(level) {
          case "Beginner":
            points += 1;
            break;
          case "Intermediate":
            points += 2;
            break;
          case "Advanced":
            points += 3;
            break;
        }
      } else if (level === "Advanced") {
        points -= 1; // Negative marking for Advanced level
      }
    });
    
    const answered = Object.keys(selectedAnswers).length;
    const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    
    return { correct, total: answered, percentage, points };
  };

  const score = calculateScore();

  // Get emoji based on score percentage
  const getScoreEmoji = () => {
    if (score.percentage >= 90) return "🏆";
    if (score.percentage >= 70) return "🌟";
    if (score.percentage >= 50) return "👍";
    return "🔄";
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-6 py-12"
      >
        <motion.h1 
          className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#B3D8A8] to-[#82A878]"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 10 
          }}
        >
          AI-Powered Quiz Generator
        </motion.h1>

        <motion.div 
          className="space-y-4 bg-[#B3D8A8]/10 backdrop-blur-lg p-8 rounded-2xl border border-[#B3D8A8]/30 shadow-lg shadow-[#B3D8A8]/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-300">
                <BookOpen className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Enter Course Name"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full pl-10 px-4 py-3 rounded-xl bg-[#B3D8A8]/5 border border-[#B3D8A8]/30 focus:border-[#82A878] focus:ring-2 focus:ring-[#B3D8A8]/40 focus:outline-none transition-all duration-300"
              />
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-300">
                <Zap className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Enter Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full pl-10 px-4 py-3 rounded-xl bg-[#B3D8A8]/5 border border-[#B3D8A8]/30 focus:border-[#82A878] focus:ring-2 focus:ring-[#B3D8A8]/40 focus:outline-none transition-all duration-300"
              />
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-300">
                <Award className="w-5 h-5" />
              </span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full pl-10 px-4 py-3 rounded-xl bg-[#B3D8A8]/5 backdrop-blur-lg border border-[#B3D8A8]/30 text-white focus:border-[#82A878] focus:ring-2 focus:ring-[#B3D8A8]/40 focus:outline-none transition-all duration-300 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23B3D8A8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                <option value="" className="bg-[#1a1a1a] text-white">Select Difficulty Level</option>
                <option value="Beginner" className="bg-[#1a1a1a] text-white">Beginner</option>
                <option value="Intermediate" className="bg-[#1a1a1a] text-white">Intermediate</option>
                <option value="Advanced" className="bg-[#1a1a1a] text-white">Advanced</option>
              </select>
            </motion.div>
          </div>

          {scoringInfo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-3 rounded-lg bg-[#B3D8A8]/5 border border-[#B3D8A8]/30"
            >
              <p className="text-sm text-[#B3D8A8]">{scoringInfo}</p>
            </motion.div>
          )}

          <motion.button
            onClick={startQuiz}
            disabled={loading}
            className="w-full mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-[#B3D8A8] to-[#82A878] text-black font-medium hover:from-[#B3D8A8]/90 hover:to-[#82A878]/90 focus:ring-4 focus:ring-[#B3D8A8]/50 transition-all duration-300 transform"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Generating Quiz...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Zap className="w-5 h-5 mr-2" />
                Start Quiz
              </span>
            )}
          </motion.button>
        </motion.div>

        {loading && (
          <div className="mt-12 flex flex-col items-center justify-center">
            <AnimatePresence>
              {generatingAnimation ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="text-center"
                >
                  <div className="relative w-32 h-32">
                    <motion.div 
                      className="absolute inset-0 rounded-full bg-[#B3D8A8]/30"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.1, 0.3],
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 2 
                      }}
                    />
                    <motion.div 
                      className="absolute inset-0 rounded-full bg-[#82A878]/20"
                      animate={{ 
                        scale: [1, 1.8, 1],
                        opacity: [0.2, 0.1, 0.2],
                      }}
                      transition={{ 
                        repeat: Infinity,
                        duration: 2.5,
                        delay: 0.2
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-16 h-16 text-blue-400" />
                    </div>
                  </div>
                  <motion.p 
                    className="mt-4 text-blue-300 font-medium"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    AI is generating your quiz...
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-3"
                >
                  <Loader className="w-8 h-8 animate-spin text-blue-500" />
                  <p>Generating quiz questions...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {!loading && quizData && quizData.length > 0 && (
            <motion.div 
              className="mt-12 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col md:flex-row justify-between items-center bg-[#FFF5E4]/5 backdrop-blur-md p-4 rounded-xl border border-[#6A9C89]/20">
                <h2 className="text-xl font-semibold">
                  <span className="text-[#FFA725]">{course}:</span> {topic} <span className="text-[#6A9C89]">({level})</span>
                </h2>
                
                {/* Score display */}
                {Object.keys(selectedAnswers).length > 0 && (
                  <motion.div 
                    className="mt-3 md:mt-0 bg-black/50 px-6 py-3 rounded-xl border border-gray-700 shadow-lg"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="font-medium">
                          Score: <span className="font-bold text-green-400">{score.correct}</span>/{score.total} 
                          <span className="ml-2 text-yellow-300">{score.percentage}%</span>
                          <span className="ml-2 text-[#B3D8A8]">({score.points} points)</span>
                          <span className="ml-1 text-xl">{getScoreEmoji()}</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              
              <div className="space-y-6">
                {quizData.map((q, index) => (
                  <motion.div 
                    key={index}
                    className="p-6 rounded-xl bg-[#B3D8A8]/5 backdrop-blur-md border border-[#B3D8A8]/30 shadow-lg hover:shadow-[#B3D8A8]/10 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: index * 0.1 }
                    }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <h2 className="text-lg font-semibold flex">
                      <motion.span 
                        className="flex items-center justify-center w-8 h-8 mr-3 rounded-full bg-[#FFA725]/20 text-[#FFA725] font-bold"
                        animate={{ 
                          boxShadow: ["0 0 0px rgba(147, 51, 234, 0.5)", "0 0 10px rgba(147, 51, 234, 0.8)", "0 0 0px rgba(147, 51, 234, 0.5)"]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          delay: index * 0.2
                        }}
                      >
                        {index + 1}
                      </motion.span>
                      <span>{q.question}</span>
                    </h2>

                    <div className="mt-4 space-y-3">
                      {q.options && Array.isArray(q.options) ? (
                        q.options.map((option, optIndex) => (
                          <motion.button
                            key={optIndex}
                            onClick={() => handleAnswerSelect(index, option)}
                            disabled={answeredQuestions[index]}
                            className={`w-full px-4 py-3 rounded-xl text-left border transition-all duration-300 ${
                              selectedAnswers[index] === option
                                ? option === q.answer
                                  ? "border-[#B3D8A8] bg-[#B3D8A8]/20 shadow-md shadow-[#B3D8A8]/20"
                                  : "border-red-500 bg-red-900/30 shadow-md shadow-red-500/20"
                                : answeredQuestions[index]
                                  ? "border-[#B3D8A8]/30 opacity-70"
                                  : "border-[#B3D8A8]/30 hover:border-[#82A878] hover:bg-[#B3D8A8]/10"
                            }`}
                            whileHover={!answeredQuestions[index] ? { scale: 1.02 } : {}}
                            whileTap={!answeredQuestions[index] ? { scale: 0.98 } : {}}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ 
                              opacity: 1, 
                              x: 0,
                              transition: { delay: 0.2 + (optIndex * 0.1) }
                            }}
                          >
                            <span className="flex items-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 mr-3 rounded-full bg-gray-800 text-gray-300 text-sm">
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              {option}
                            </span>
                          </motion.button>
                        ))
                      ) : (
                        <p className="text-red-500">Options not available</p>
                      )}
                    </div>

                    <AnimatePresence>
                      {showAnswers[index] && (
                        <motion.div 
                          className="mt-5"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center">
                            <p className="text-sm">
                              Correct Answer: <span className="font-semibold text-green-400">{q.answer}</span>
                            </p>
                            {selectedAnswers[index] === q.answer ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ 
                                  type: "spring", 
                                  stiffness: 200, 
                                  damping: 10,
                                  delay: 0.2 
                                }}
                              >
                                <CheckCircle className="ml-2 text-green-500 w-6 h-6" />
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ 
                                  type: "spring", 
                                  stiffness: 200, 
                                  damping: 10,
                                  delay: 0.2 
                                }}
                              >
                                <XCircle className="ml-2 text-red-500 w-6 h-6" />
                              </motion.div>
                            )}
                            
                            {/* Explanation toggle button */}
                            <motion.button 
                              onClick={() => toggleExplanation(index)}
                              className="ml-4 px-4 py-1 bg-[#6A9C89] hover:bg-[#6A9C89]/80 rounded-lg text-xs flex items-center"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Info className="w-4 h-4 mr-1" />
                              {showExplanations[index] ? "Hide" : "Show"} Explanation
                              {showExplanations[index] ? 
                                <ChevronUp className="w-4 h-4 ml-1" /> : 
                                <ChevronDown className="w-4 h-4 ml-1" />
                              }
                            </motion.button>
                          </div>
                          
                          {/* Explanation section */}
                          <AnimatePresence>
                            {showExplanations[index] && (
                              <motion.div 
                                className="mt-3 p-4 bg-[#FFF5E4]/5 rounded-xl border-l-4 border-[#FFA725]"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                              >
                                <p className="text-sm text-gray-200">{q.explanation}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
              
              {/* Control buttons */}
              <motion.div 
                className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={resetQuiz}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#B3D8A8] text-black font-medium hover:bg-[#B3D8A8]/80 transition-colors duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Answers
                </motion.button>
                
                <motion.button
                  onClick={generateNewQuiz}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#B3D8A8] to-[#82A878] text-black font-medium hover:opacity-90 transition-all duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Questions
                </motion.button>
                
                <motion.button
                  onClick={resetEntireQuiz}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors duration-300"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Start Over
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!loading && quizStarted && (!quizData || quizData.length === 0) && (
            <motion.div 
              className="mt-8 p-6 rounded-xl bg-red-900/30 backdrop-blur-md border border-red-500/30 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-yellow-400">No questions were generated. Please try again with different parameters.</p>
              <motion.button
                onClick={resetEntireQuiz}
                className="mt-4 px-6 py-2 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Reset
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {!loading && !quizStarted && (
            <motion.div 
              className="mt-12 p-6 rounded-xl bg-[#B3D8A8]/10 backdrop-blur-md border border-[#B3D8A8]/30 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  repeatType: "reverse"
                }}
              >
                <Zap className="w-12 h-12 mx-auto text-[#B3D8A8] mb-3" />
              </motion.div>
              <p className="text-lg text-[#B3D8A8]">Enter course information and click "Start Quiz" to generate questions.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default QuizPage;