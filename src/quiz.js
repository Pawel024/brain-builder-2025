import React, { useState, useEffect } from 'react';
import { safeGet } from './utils/axiosUtils';
import { Flex, Box, Button, Heading, TextField } from '@radix-ui/themes';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Progress from '@radix-ui/react-progress';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import Header from './common/header';
import '@radix-ui/themes/styles.css';
import './css/App.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import a11yDark from './code_preview/a11y-dark';

const ScoreScreen = ({ score, userAnswers, handleRetry }) => (
  <Box style={{ boxShadow: '0 2px 8px var(--slate-a11)', borderRadius: "var(--radius-3)", width:window.innerWidth/3, padding: '30px 50px', background:"solid", backgroundColor:"white" }}>
    <Flex gap="1" direction="column" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Heading size='5' style={{ color: 'var(--slate-12)', marginBottom:20 }}>
          Quiz Finished!
      </Heading>
      <Box>
          <Heading size='3' style={{ color: 'var(--slate-12)', marginBottom:20 }}>
          Your score is: {score}
          </Heading>
      </Box>
      <Box>
        <Heading size='3' style={{ color: 'var(--slate-12)', marginBottom:15 }}>
          Your answers:
        </Heading>
        {userAnswers.map((option, index) => (
          <p key={index}>
            Question {index + 1}: {option.selectedOption} {option.isCorrect ? (<CheckCircledIcon color='green'/>) : (<CrossCircledIcon color='red'/>)}
          </p>
        ))}
      </Box>
      <Button onClick={(event) => handleRetry(event)} style={{marginTop:10}}>Retry</Button>
    </Flex>
  </Box>
);


const Quiz = ({ questions }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [progress, setProgress] = useState(0);
  const [textInputValue, setTextInputValue] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => setProgress((currentQuestion+1)/(questions.length)*100-currentQuestion), 250);
    return () => clearTimeout(timer);
  }, [currentQuestion, questions.length]);

  useEffect(() => {
    setSelectedOption(null);
  }, [currentQuestion]);

  const handleOptionClick = (event) => {
    event.preventDefault();
    
    let isCorrect = false;
    if (questions[currentQuestion].question_type === "text" || questions[currentQuestion].question_type === "coding") {
      isCorrect = questions[currentQuestion].options[0].optionText.replace(/ /g, '') === textInputValue.replace(/ /g, '');        
    }
    else {
      isCorrect = questions[currentQuestion].options[selectedOption].isCorrect;
    }
    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    // save the answer in userAnswers
    if (questions[currentQuestion].question_type === "text" || questions[currentQuestion].question_type === "coding") {
      setUserAnswers((prevUserAnswers) => [
        ...prevUserAnswers,
        { selectedOption: textInputValue, isCorrect },
      ]);
    } else {
      setUserAnswers((prevUserAnswers) => [
        ...prevUserAnswers,
        { selectedOption: questions[currentQuestion].options[selectedOption].optionText, isCorrect },
      ]);
    }
  
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      setIsQuizFinished(true);
    }
  };

  const handleRetry = (event) => {
    event.preventDefault();
    setIsQuizFinished(false);
    setScore(0);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setProgress(0);
  };

  return (
    <div>
    <Header showHomeButton={true}/>
    <Box style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: window.innerHeight-52, backgroundImage: 'linear-gradient(330deg, rgba(7,62,185, 0.15) 0%, rgba(7,185,130, 0.15) 100%)'}}>
    {isQuizFinished ? <ScoreScreen score={score} userAnswers={userAnswers} handleRetry={handleRetry} /> : (
      <Box style={{ boxShadow: '0 2px 8px var(--slate-a11)', borderRadius: "var(--radius-3)", width:window.innerWidth/3, padding: '30px 50px', background:"solid", backgroundColor:"white" }}>
        <Flex gap="1" direction="column" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Progress.Root className="ProgressRoot" value={progress} style={{ marginBottom:5 }}>
            <Progress.Indicator
              className="ProgressIndicator"
              style={{ transform: `translateX(-${100 - progress}%)` }}
            />
          </Progress.Root>
          <Heading size='2' style={{ color: 'var(--slate-12)', marginBottom:25 }}>
              Question {currentQuestion + 1} of {questions.length}
          </Heading>
          <Box style={{ marginBottom:10 }}>
              <Heading size='5' style={{ color: 'var(--slate-12)', marginBottom:15 }}>
              {questions[currentQuestion].question}
              </Heading>
          </Box>
        </Flex>
        <form onSubmit={(event) => handleOptionClick(event)}>
          <Flex gap="2" direction="column" style={{ justifyContent: 'center', alignItems: 'center' }}>
          {questions[currentQuestion].question_type === "multiple choice" ? (<RadioGroup.Root className="RadioGroupRoot" defaultValue="default" aria-label="Multiple choice question" value={selectedOption !== null ? selectedOption.toString() : ''} onValueChange={setSelectedOption}>
            {questions[currentQuestion].options.map((option, index) => (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <RadioGroup.Item className="RadioGroupItem" value={index.toString()} key={index}>
                  <RadioGroup.Indicator className="RadioGroupIndicator" />
                </RadioGroup.Item>
                <label className="Label" htmlFor="r1">
                  {option.optionText}
                </label>
              </div>
            ))}
          </RadioGroup.Root>): questions[currentQuestion].question_type === "text" ? (<TextField.Root color="gray" placeholder="Type your answer…" style={{ width:window.innerWidth/3.75 }} onChange={event => setTextInputValue(event.target.value)} onKeyDown={event => {
            if (event.key === 'Enter') {
              handleOptionClick(event);
            }}}/>
          ) : (<>
            <SyntaxHighlighter language="python" style={a11yDark} customStyle={{ width:window.innerWidth/3.75 }} wrapLongLines={true} showLineNumbers={true}>
              {questions[currentQuestion].code.trim()}
            </SyntaxHighlighter>
            <TextField.Root style={{ marginTop:20, width:window.innerWidth/3.75 }}
              color="gray" 
              placeholder="Type your answer…"
              onChange={event => setTextInputValue(event.target.value)} 
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  handleOptionClick(event);
                }
              }}
            />
          </>)}
          <Button onClick={(event) => handleOptionClick(event)} style={{marginTop:20}}>Next</Button>
          </Flex>
        </form>
      </Box>
    )}
    </Box>
    </div>
  );
};
  
function QuizApp({ quizId=11 }) {

  // ------- HIDE PRELOADER -------
  useEffect(() => {
    const preloader = document.getElementById("preloader");
    if (preloader) {
        preloader.style.display = "none";
    }
  }, []);

  // ------- ACTUAL QUIZ -------
  
  const [questions, setQuestions] = useState([
    {
      question: 'What is the capital of France?',
      options: [
        { optionText: 'Paris', isCorrect: true },
        { optionText: 'London', isCorrect: false },
        { optionText: 'Berlin', isCorrect: false },
        { optionText: 'Madrid', isCorrect: false },
      ],
      question_type: "multiple choice",
    },
  ]);

  //TODO: replace the sample question with some kind of a loading/error screen

  useEffect(() => {
    safeGet(window.location.origin + '/api/quizzes/?quiz_id=' + quizId.toString())
    .then(response => {
      setQuestions(response.data.questions);
  })
    .catch(error => console.error(error));
  }, [quizId]);

  useEffect(() => {
    setQuestions(questions.filter((question) => {
      return !(question.question === "");
    }));
  }, [questions]);

  return <Quiz questions={questions} />;
}

export default QuizApp;