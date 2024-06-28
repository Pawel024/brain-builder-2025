import React from 'react';
import Header from '../common/header';
import '../css/App.css';
import { Flex, Box, Heading } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import { RocketIcon, Pencil2Icon, Link2Icon } from '@radix-ui/react-icons';
import { ChallengeButton, LevelHeading, GridBox, OtherButton } from './levelComponents';
import Readme from '../readme';
import Level from './level';
import * as Progress from '@radix-ui/react-progress';
import '../css/App.css';

function ProgressBox({progress}) {

    const verbalid = require('verbal-id');
    let myId = verbalid.create();
    myId = myId.replace(/\s/g, '-');

    return (
        <Box style={{ border: "2px solid", borderColor: "var(--slate-8)", borderRadius: "var(--radius-3)", padding: '10px 24px'}} >
            <Flex direction='column' gap='1' style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Heading as='h2' size='5' style={{ color: 'var(--slate-12)', marginBottom:10 }}>Your Progress</Heading>
                <Progress.Root className="ProgressRoot" value={progress} style={{ marginBottom:5, width: '100%' }}>
                    <Progress.Indicator
                    className="ProgressIndicator"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                    />
                </Progress.Root>
                <label style={{paddingTop: 5, fontSize: 'var(--font-size-2)'}}>Copy this code to continue in a different browser</label>
                <label style={{fontSize: 'var(--font-size-2)', color: 'var(--cyan-10)'}}>{myId}</label>
            </Flex>
        </Box>
    );
}

function GettingStarted({showContent, handleShowContent}) {

    const toggleContent = () => handleShowContent(-1, !showContent);

    return (
        <Box style={{ border: "2px solid", borderColor: "var(--slate-8)", borderRadius: "var(--radius-3)", padding: '10px 24px'}}
            onClick={toggleContent}>
                <LevelHeading level={-1} name="Getting Started" />
                {showContent && (
                    <GridBox>
                        <ChallengeButton link="tutorial" label="Tutorial" Icon={RocketIcon} active={true} />
                        <ChallengeButton link="custom11" label="The Perceptron 1" Icon={RocketIcon} active={true} />
                    </GridBox>
                )}
        </Box>
    );
}

/*
<Box style={{ display: 'flex', flexDirection: 'row', gap: '15px', width: '100%' }}>
                    <OtherButton link="tutorial" label="Tutorial" active={true} />
                    <OtherButton link="custom11" label="The Perceptron 1" active={true} />
                </Box>*/

/*<Box style={{ border: "2px solid", borderColor: "var(--slate-8)", borderRadius: "var(--radius-3)", padding: '10px 24px' }}>
            <LevelHeading level={-1} name="Getting Started" />
            <GridBox>
                <ChallengeButton link="tutorial" label="Tutorial" Icon={RocketIcon} active={true} />
                <ChallengeButton link="custom11" label="The Perceptron 1" Icon={RocketIcon} active={true} />
            </GridBox>
        </Box>*/

function WrappingUp() {
    return (
        <Box style={{ border: "2px solid", borderColor: "var(--slate-8)", borderRadius: "var(--radius-3)", padding: '10px 24px' }}>
            <LevelHeading level={-1} name="Wrapping Up" />
            <GridBox>
                <ChallengeButton link="notebookTest" label="Notebook Test" Icon={RocketIcon} active={true} />
                <ChallengeButton link="feedback" label="Give Feedback" Icon={Pencil2Icon} active={true} />
                <ChallengeButton link="links" label="Useful Links" Icon={Link2Icon} active={true} />
            </GridBox>
        </Box>
    );
}

function ReadmeBox() {
    return (
        <Box style={{ flex: 1, border: "2px solid", borderColor: "var(--slate-8)", borderRadius: "var(--radius-3)", padding: '10px 30px' }}>
            <LevelHeading level={-1} name="Readme" />
            <Box>
                <Readme file="readme"/>
            </Box>
        </Box>
    );
}

// Function to store progressData in a cookie
function storeProgress(progressData) {
    const serializedData = encodeURIComponent(JSON.stringify(progressData));
    document.cookie = `progressData=${serializedData};path=/;max-age=31536000`; // Expires in 1 year
}

// Function to retrieve progressData from a cookie
function getProgress() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('progressData='))
        ?.split('=')[1];
return cookieValue ? JSON.parse(decodeURIComponent(cookieValue)) : null;
}

class StartPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tasksByLevel: this.groupByIds(props.taskIds),
            quizzesByLevel: this.groupByIds(props.quizIds),
            introsByLevel: this.groupByIds(props.introIds),
            showContent: Array(props.levelNames.length+1).fill(false),
            progressData: null,
            percentCompleted: 0,
        };
    }

    groupByIds(ids) {
        return ids.reduce((acc, id) => {
            const level = Math.floor(id / 10);
            const challenge = id % 10;
            if (!acc[level]) {
                acc[level] = [];
            }
            acc[level].push(challenge);
            return acc;
        }, {});
    }

    initializeProgressData(tasksByLevel, quizzesByLevel, introsByLevel) {
    
        const progressData = {
            challenges: {},
            quizzes: {},
            intros: {}
        };

        // Initialize challenges and quizzes
        ['challenges', 'quizzes'].forEach(type => {
            const byLevel = type === 'challenges' ? tasksByLevel : quizzesByLevel;
            Object.keys(byLevel).forEach(level => {
                if (!progressData[type][level]) {
                    progressData[type][level] = [];
                }
                // First item 'open', rest 'disabled'
                progressData[type][level] = byLevel[level].map((item, index) => 
                    index === 0 ? 'completed' : 'disabled');
            });
        });
    
        // Initialize intros
        Object.keys(introsByLevel).forEach(level => {
            if (!progressData.intros[level]) {
                progressData.intros[level] = [];
            }
            // First intro 'open', rest 'disabled'
            progressData.intros[level] = introsByLevel[level].map((intro, index) => 
                index === 0 ? 'open' : 'disabled');
        });
    
        console.log('Final progressData:', progressData);
    
        return progressData;
    }

    // method to count how many % out of progressData entries are 'completed'
    countPercentCompleted(progressData) {
        let countCompleted = 0;
        let countTotal = 0;
        for (const type in progressData) {
            for (const level in progressData[type]) {
                countCompleted += progressData[type][level].filter(item => item === 'completed').length;
                countTotal += progressData[type][level].length;
            }
        }
        return countTotal > 0 ? Math.round(countCompleted / countTotal * 100) : 0;
    }

    componentDidMount() {
        let tasksByLevel = this.groupByIds(this.props.taskIds);
        let quizzesByLevel = this.groupByIds(this.props.quizIds);
        let introsByLevel = this.groupByIds(this.props.introIds);
        let progressData = getProgress();
    
        if (!progressData) {
            progressData = this.initializeProgressData(tasksByLevel, quizzesByLevel, introsByLevel);
        }

        this.setState({
            tasksByLevel,
            quizzesByLevel,
            introsByLevel,
            progressData,
            percentCompleted: this.countPercentCompleted(progressData)
        }, () => {
            console.log('Progress data initialized:', this.state.progressData);
        });

    }

    componentDidUpdate(prevProps) {
        if (this.props.taskIds !== prevProps.taskIds || this.props.quizIds !== prevProps.quizIds || this.props.introIds !== prevProps.introIds) {
            const tasksByLevel = this.groupByIds(this.props.taskIds);
            const quizzesByLevel = this.groupByIds(this.props.quizIds);
            const introsByLevel = this.groupByIds(this.props.introIds);
            
            this.setState({
                tasksByLevel,
                quizzesByLevel,
                introsByLevel,
                progressData: this.initializeProgressData(tasksByLevel, quizzesByLevel, introsByLevel),
                percentCompleted: this.countPercentCompleted(this.state.progressData),
            });
        }
    }

    handleShowContent = (index, expand) => {
        if (index < 0) {
            index = this.state.showContent.length + index;
        }

        this.setState({
            showContent: this.state.showContent.map((value, i) => 
                i === index ? expand : (expand ? false : value)
            )
        });
    };

    render () { return(
    <div>
        <Header showHomeButton={false} />
        <Flex direction='row' gap='3' style={{padding:'10px 10px', alignItems: 'flex-start' }}>

            <Flex direction='column' gap='3' style={{ flex:1 }}>

                <ProgressBox progress={this.state.percentCompleted} />

                <GettingStarted showContent={this.state.showContent[0]} handleShowContent={this.handleShowContent} />

                {Object.entries(this.state.tasksByLevel).map(([level, challenges]) => (
                    <Level key={level} level={level} levelNames={this.props.levelNames} taskNames={this.props.taskNames} introData={this.props.introData} quizData={this.props.quizData} introsByLevel={this.state.introsByLevel} quizzesByLevel={this.state.quizzesByLevel} challenges={challenges} showContent={this.state.showContent[level-1]} handleShowContent={this.handleShowContent} progressData={this.state.progressData} />
                ))} 

                <WrappingUp />

            </Flex>

            <Flex direction='column' gap='3' style={{ flex: 1 }}>
                <ReadmeBox />
            </Flex>

        </Flex>
    </div>
    )}
}

export default StartPage;