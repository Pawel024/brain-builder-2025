import React from 'react';
import Header from '../common/header';
import '../css/App.css';
import { Box, Flex } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import Level from './level';
import { ReadmeBox, FeedbackButton } from './levelComponents';
import { groupByIds, groupByIndex } from '../utils/byLevelUtils';
import { TextArea } from '@radix-ui/themes';

class StartPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tasksByLevel: groupByIds(props.taskIds),
            iconsByLevel: groupByIndex(props.taskIcons, props.taskIds),
            quizzesByLevel: groupByIds(props.quizIds),
            introsByLevel: groupByIds(props.introIds),
            showContent: Array(props.levelNames.length+1).fill(false),
        };
    }

    componentDidMount() {
        // hide the preloader when page loaded
        const preloader = document.getElementById("preloader");
        if (preloader) {
            preloader.style.display = "none";
        }

        const tasksByLevel = groupByIds(this.props.taskIds);
        const iconsByLevel = groupByIndex(this.props.taskIcons, this.props.taskIds, tasksByLevel);
        const quizzesByLevel = groupByIds(this.props.quizIds);
        const introsByLevel = groupByIds(this.props.introIds);
        const progressData = this.props.progressData;

        this.setState({
            tasksByLevel,
            iconsByLevel,
            quizzesByLevel,
            introsByLevel,
            progressData
        });

    }

    componentDidUpdate(prevProps) {
        if (this.props.taskIds !== prevProps.taskIds || this.props.quizIds !== prevProps.quizIds || this.props.introIds !== prevProps.introIds) {
            const tasksByLevel = groupByIds(this.props.taskIds);
            const iconsByLevel = groupByIndex(this.props.taskIcons, this.props.taskIds, tasksByLevel);
            const quizzesByLevel = groupByIds(this.props.quizIds);
            const introsByLevel = groupByIds(this.props.introIds);
            const progressData = this.props.progressData;

            this.setState({
                tasksByLevel,
                iconsByLevel,
                quizzesByLevel,
                introsByLevel,
                progressData
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

    render () { 

        const gap = 12;

        return(
            <div style={{ height: '100vh', overflow: 'hidden' }}>
                <Header showHomeButton={false} />
                <div style={{display: 'flex', direction: 'row', gap: `${gap}px`, padding: `${gap}px`, alignItems: 'flex-start' }}>

                    <Flex direction='column' gap='3' style={{ flex:1 }}>

                        {Object.entries(this.state.tasksByLevel).map(([level, challenges]) => (
                            <Level key={level} level={level} levelNames={this.props.levelNames} taskNames={this.props.taskNames} introData={this.props.introData} quizData={this.props.quizData} introsByLevel={this.state.introsByLevel} quizzesByLevel={this.state.quizzesByLevel} challengeIcons={this.state.iconsByLevel[level]} challenges={challenges} showContent={this.state.showContent[level-1]} handleShowContent={this.handleShowContent} progressData={this.state.progressData} links={this.props.links} />
                        ))} 

                    </Flex>

                    <Flex direction='column' gap='3' style={{ flex: 1 }}>
                        <ReadmeBox />
                    </Flex>
                </div>

                <Box style={{ position: 'absolute', bottom: `${1.5*gap}px`, right: `${1.5*gap}px` }}>
                    <FeedbackButton/>
                </Box>
            </div>
        )}
}

export default StartPage;