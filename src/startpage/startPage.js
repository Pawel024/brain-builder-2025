import React from 'react';
import Header from '../common/header';
import '../css/App.css';
import { Flex } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import Level from './level';
import {ReadmeBox } from './levelComponents';

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
            iconsByLevel: this.groupByIndex(props.taskIcons, props.taskIds),
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

    groupByIndex(vars, ids, groupedIds = null) {
        if (!groupedIds) {
            groupedIds = this.groupByIds(ids);
        }
        const groupedVars = {};
        for (const level in groupedIds) {
            groupedVars[level] = groupedIds[level].map(challenge => {
                const id = parseInt(level) * 10 + challenge;
                const index = ids.indexOf(id);
                return vars[index];
            });
        }
        return groupedVars;
    }

    initializeProgressData(tasksByLevel, quizzesByLevel, introsByLevel) { // TODO: link this to the Progress database
    
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
                // First item 'open', rest 'disabled' ---> not anymore, now everything is open
                progressData[type][level] = byLevel[level].map((item, index) => 
                    'disabled');  // other option is 'disabled'
            });
        });
    
        // Initialize intros
        Object.keys(introsByLevel).forEach(level => {
            if (!progressData.intros[level]) {
                progressData.intros[level] = [];
            }
            // First intro 'open', rest 'disabled' ---> not anymore, now everything is open
            progressData.intros[level] = introsByLevel[level].map((intro, index) => 
                'open');
        });
    
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
        let iconsByLevel = this.groupByIndex(this.props.taskIcons, this.props.taskIds, tasksByLevel);
        let quizzesByLevel = this.groupByIds(this.props.quizIds);
        let introsByLevel = this.groupByIds(this.props.introIds);
        let progressData = getProgress();
    
        if (!progressData) {
            progressData = this.initializeProgressData(tasksByLevel, quizzesByLevel, introsByLevel);
        }

        this.setState({
            tasksByLevel,
            iconsByLevel,
            quizzesByLevel,
            introsByLevel,
            progressData,
            percentCompleted: this.countPercentCompleted(progressData)
        });

    }

    componentDidUpdate(prevProps) {
        if (this.props.taskIds !== prevProps.taskIds || this.props.quizIds !== prevProps.quizIds || this.props.introIds !== prevProps.introIds) {
            const tasksByLevel = this.groupByIds(this.props.taskIds);
            const iconsByLevel = this.groupByIndex(this.props.taskIcons, this.props.taskIds, tasksByLevel);
            const quizzesByLevel = this.groupByIds(this.props.quizIds);
            const introsByLevel = this.groupByIds(this.props.introIds);
            
            this.setState({
                tasksByLevel,
                iconsByLevel,
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

                {Object.entries(this.state.tasksByLevel).map(([level, challenges]) => (
                    <Level key={level} level={level} levelNames={this.props.levelNames} taskNames={this.props.taskNames} introData={this.props.introData} quizData={this.props.quizData} introsByLevel={this.state.introsByLevel} quizzesByLevel={this.state.quizzesByLevel} challengeIcons={this.state.iconsByLevel[level]} challenges={challenges} showContent={this.state.showContent[level-1]} handleShowContent={this.handleShowContent} progressData={this.state.progressData} links={this.props.links} />
                ))} 

            </Flex>

            <Flex direction='column' gap='3' style={{ flex: 1 }}>
                <ReadmeBox />
            </Flex>

        </Flex>
    </div>
    )}
}

export default StartPage;