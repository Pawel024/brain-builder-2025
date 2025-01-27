import React from 'react';
import { RocketIcon, Pencil2Icon, DrawingPinIcon } from '@radix-ui/react-icons';
import { ChallengeButton, LevelBox, LevelHeading, GridBox } from './levelComponents';


function Level({ level, levelNames, taskNames, introData, quizData, introsByLevel, quizzesByLevel, challengeIcons, challenges, showContent, handleShowContent, progressData, links }) {

  const levelStr = String(level);

  const states_to_active = {
    'disabled': false,
    'open': true,
    'hidden': true,
  } 
  const states_to_completed = {
    'disabled': false,
    'open': false,
    'hidden': true,
  }

  function isActive(type, level, index) {
    if (progressData[type] && progressData[type]?.[level] && progressData[type]?.[level]?.[index] !== undefined) {
      return states_to_active[progressData[type][level][index]];
    }
    return false;
  }

  function isCompleted(type, level, index) {
    if (progressData[type] && progressData[type]?.[level] && progressData[type]?.[level]?.[index] !== undefined) {
      return states_to_completed[progressData[type][level][index]];
    }
    return false;
  }

  return (
    <LevelBox level={level} showContent={showContent} handleShowContent={handleShowContent}>
        <LevelHeading level={level} name={levelNames[level-1]} />
        {showContent && (
            <GridBox>
                {introsByLevel[level] && introsByLevel[level].map((intro, index) => {
                    const entry = introData.find(entry => entry.intro_id === 10*level+intro);
                    return entry && entry.visibility ? (
                        <ChallengeButton key={`intro${level}${intro}_button`}
                            link={`introduction${level}${intro}`}
                            label="Introduction"
                            Icon={DrawingPinIcon}
                            active={isActive("intros", levelStr, index)}
                            completed={isCompleted("intros", levelStr, index)}
                        />
                    ) : null;
                })}

                {challenges.map((challenge, index) => (
                    <ChallengeButton key={`challenge${level}${challenge}_button`}
                        link={links?.[10*level+challenge] ?? `exercise${level}.${challenge}`}
                        label={taskNames[`${level}${challenge}`]}
                        Icon={challengeIcons[index] || RocketIcon}
//                        active={isActive("challenges", levelStr, index)}
                        active={true}
                        completed={isCompleted("challenges", levelStr, index)}
                    />
                ))}

                {quizzesByLevel[level] && quizzesByLevel[level].map((quiz, index) => {
                    const entry = quizData.find(entry => entry.quiz_id === 10*level+quiz);
                    return entry && entry.visibility ? (
                        <ChallengeButton key={`quiz${level}${quiz}_button`}
                            link={`quiz${level}${quiz}`}
                            label="Quiz"
                            Icon={Pencil2Icon}
                            active={isActive("quizzes", levelStr, index)}
                            completed={isCompleted("quizzes", levelStr, index)}
                        />
                    ) : null;
                })}
            </GridBox>
        )}
    </LevelBox>
  );
}

export default Level;