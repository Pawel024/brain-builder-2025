import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flex, Box, Button, Heading, TextArea } from '@radix-ui/themes';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Progress from '@radix-ui/react-progress';
import { CheckCircledIcon } from '@radix-ui/react-icons';
import Header from './common/header';
import Stars from './common/stars';
import '@radix-ui/themes/styles.css';
import './css/App.css';

const FeedbackForm = ({ questions, host, cookie }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textInputValue, setTextInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(Array(questions.length).fill(''));
  
  useEffect(() => {
    const timer = setTimeout(() => setProgress((currentQuestion+1)/(questions.length)*100-currentQuestion), 250);
    return () => clearTimeout(timer);
  }, [currentQuestion, questions.length]);

  useEffect(() => {
    setSelectedOption(null);
  }, [currentQuestion]);

  const handleOptionClick = (event) => {
    event.preventDefault();
  
    // save the answer in userAnswers
    let userAnswer;
    if (questions[currentQuestion].question_type === "text") {
      userAnswer = textInputValue;
    } else if (questions[currentQuestion].question_type === "rating") {
      userAnswer = selectedOption;
    }

    setFeedback((prevFeedback) => {
      const newFeedback = [...prevFeedback];
      newFeedback[currentQuestion] = userAnswer;
      return newFeedback;
    });
  
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setTextInputValue("");
      setCurrentQuestion(nextQuestion);
    } else {
      setIsFinished(true);
    }
  };

  const handleBackClick = (event) => {
    event.preventDefault();
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  useEffect(() => {
    if (isFinished) {
    axios.post(host + '/api/feedback', { feedback: feedback }, {headers: { 'X-CSRFToken': cookie }})
      .then(response => {
        console.log(response);
      })
      .catch(error => {
        console.error(error);
      });
    }
  }, [isFinished]);

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: window.innerHeight-52, backgroundImage: 'linear-gradient(330deg, rgba(7,62,185, 0.15) 0%, rgba(7,185,130, 0.15) 100%)'}}>
      {isFinished ? (<Box style={{ boxShadow: '0 2px 8px var(--slate-a11)', borderRadius: "var(--radius-3)", maxWidth:window.innerWidth/2.75, padding: '30px 50px', background:"solid", backgroundColor:"white" }}>
          <Flex gap="1" direction="column" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Heading size='2' style={{ color: 'var(--slate-12)', marginBottom:25 }}>
              Thank you for your feedback!
            </Heading>
            <CheckCircledIcon color="green" width="30" height="30" />
          </Flex>
        </Box>
      ) : (<Box style={{ boxShadow: '0 2px 8px var(--slate-a11)', borderRadius: "var(--radius-3)", maxWidth:window.innerWidth/2.75, padding: '30px 50px', background:"solid", backgroundColor:"white" }}>
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
        <form >
          <Flex gap="2" direction="column" style={{ justifyContent: 'center', alignItems: 'center' }}>
          {questions[currentQuestion].question_type === "text" ? (<TextArea color="gray" placeholder="Type your answer…" style={{ width:window.innerWidth/3.6, minHeight: '100px', resize: 'vertical' }} onChange={event => setTextInputValue(event.target.value)} onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              handleOptionClick(event);
            }}}/>
          ) : (
            <RadioGroup.Root className="RadioGroupRoot" defaultValue="default" aria-label="Multiple choice question" value={selectedOption !== null ? selectedOption.toString() : ''} onValueChange={setSelectedOption}>
              {questions[currentQuestion].options.map((option, index) => (
                <div style={{ display: 'flex', alignItems: 'center' }} key={`radio_div_${index}`}>
                  <RadioGroup.Item className="RadioGroupItem" value={index.toString()} key={`radio_group_${index}`}>
                    <RadioGroup.Indicator className="RadioGroupIndicator" key={`radio_indicator_${index}`} />
                  </RadioGroup.Item>
                  <label className="Label" htmlFor="r1" key={`radio_label_${index}`}>
                    {option.optionText}
                  </label>
                </div>
              ))}
            </RadioGroup.Root>
          )}
          <Flex gap="3" style={{marginTop:20}}>
            {currentQuestion > 0 && <Button onClick={handleBackClick}>Back</Button>}
            <Button onClick={(event) => handleOptionClick(event)}>Next</Button>
          </Flex>
          </Flex>
        </form>
      </Box>
      )}
    </Box>
  );
};
  
function FeedbackApp({ host, cookie }) {

  // ------- HIDE PRELOADER -------
  useEffect(() => {
      const preloader = document.getElementById("preloader");
      if (preloader) {
          preloader.style.display = "none";
      }
    }, []);


  // ------- ACTUAL FORM -------

  const [questions, setQuestions] = useState([
    {
      question: 'What overall score would you give our app?',
      options: [
        { optionText: <Stars rating={5} />, isCorrect: false },
        { optionText: <Stars rating={4} />, isCorrect: false },
        { optionText: <Stars rating={3} />, isCorrect: false },
        { optionText: <Stars rating={2} />, isCorrect: false },
        { optionText: <Stars rating={1} />, isCorrect: false },
      ],
      question_type: "rating",
    },
    {
      question: 'Were the explanations clear?',
      options: [
        { optionText: 'Yes, they were very clear', isCorrect: false },
        { optionText: 'They were ok', isCorrect: true },
        { optionText: 'There were some issues', isCorrect: false },
        { optionText: 'No, they were confusing', isCorrect: false },
      ],
      question_type: "rating",
    },
    {
      question: 'Did you experience any technical issues?',
      options: [
        { optionText: 'No, everything ran smoothly', isCorrect: false },
        { optionText: 'Yes, some, but it did not bother me', isCorrect: true },
        { optionText: 'Yes, some, but they were annoying', isCorrect: false },
        { optionText: 'Yes, many, it was very frustrating', isCorrect: false },
      ],
      question_type: "rating",
    },
    {
      question: 'I experienced the following technical issues:',
      options: [ {optionText: '7', isCorrect: true }, ],
      question_type: "text",
    },
    {
      question: 'Do you think this tool is a useful addition to the course?',
      options: [
        { optionText: "Yes, this is really helpful!", isCorrect: false },
        { optionText: 'Yes, but with some modifications', isCorrect: false },
        { optionText: 'It could be helpful, but is not necessary', isCorrect: true },
        { optionText: 'The existing course material is enough for me', isCorrect: false },
        { optionText: 'I\'m not taking the course', isCorrect: false}
      ],
      question_type: "rating",
    },
    {
      question: 'How could we improve this tool?',
      options: [ {optionText: '7', isCorrect: true }, ],
      question_type: "text",
    },
    {
      question: 'Do you want to see more dedicated tools like this one in other TU Delft courses?',
      options: [
        { optionText: 'Yes, that would be very helpful!', isCorrect: true },
        { optionText: 'Maybe...', isCorrect: false },
        { optionText: 'No, I don\'t think I \'d use them', isCorrect: false },
        { optionText: 'I don\'t study at TU Delft', isCorrect: false}
      ],
      question_type: "rating",
    },
    {
      question: 'Anything else you would like to share?',
      options: [ {optionText: '7', isCorrect: true }, ],
      question_type: "text",
    },
  ]);

  useEffect(() => {
    setQuestions(questions.filter((question) => {
      return !(question.question === "");
    }));
  }, [questions]);

  return (
  <div>
    <Header showHomeButton={true}/>
    <FeedbackForm questions={questions} host={host} cookie={cookie} />;
  </div>
  );
}

export default FeedbackApp;