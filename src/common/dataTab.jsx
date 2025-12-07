import React from 'react';
import { Box, Flex, Separator, Heading } from '@radix-ui/themes';
import Slider from 'react-animated-slider';
import { SlideButton } from './floatingButtons';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import horizontalCss from '../css/horizontalSlides.module.css';

const DataTab = ({ description, currentSlide, setCurrentSlide, initPlot }) => {
    return (
        <Flex direction="row" gap="2" style={{ overflow: 'hidden', width: '100%', height: window.innerHeight-116 }}>
                            
            {/* slides with descriptions loaded from the database */}
            <Box style={{ flexBasis: '50%' }}>   
            {description.length > 0 ? (           
            <Flex direction='column' gap='2' style={{ padding: '20px 10px', display: 'flex', justifyContent:"center", alignItems:"center" }}>
                <Flex style={{ flexbasis:'100%', marginBottom: 0, width:'100%' }}>
                <Slider key={currentSlide} classNames={horizontalCss} infinite={false} slideIndex={currentSlide}
                    previousButton={
                    <SlideButton 
                        onClick={() => {
                        const prevSlide = currentSlide - 1;
                        if (prevSlide >= 0) {
                            setCurrentSlide(prevSlide);
                        }
                        }}
                        disabled={currentSlide <= 0}
                        rightPointing={false}
                    />
                    }
                    nextButton={
                    <SlideButton
                        onClick={() => {
                        const nextSlide = currentSlide + 1;
                        if (nextSlide < description.length) {
                            setCurrentSlide(nextSlide);
                        }
                        }}
                        disabled={currentSlide >= description.length - 1}
                        rightPointing={true}
                    />
                    }
                >
                    {description.map(([subtitle, ...paragraphs], index) => (
                    <div key={index} className="slide-container">
                        <div className="slide-content">
                        <Heading as='h2' size='5' style={{ color: 'var(--slate-12)', marginBottom:7, textAlign:"center" }}>&gt;_{subtitle} </Heading>
                        {paragraphs.map((paragraph, pIndex) => (
                            //<p key={pIndex} dangerouslySetInnerHTML={{ __html: paragraph }}></p>
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>{paragraph}</ReactMarkdown>
                        ))}
                        </div>
                    </div>
                    ))}
                </Slider>
                </Flex>
            </Flex>
            ):(<div/>)}
            </Box>

            <Separator orientation='vertical' style = {{ height: window.innerHeight-152, position: 'fixed', left: window.innerWidth * 0.5, bottom: (window.innerHeight-92) * 0.5, transform: `translateY(${(window.innerHeight - 152) / 2}px)` }}/>

            {/* plot of the data */}
            <Box style={{ flexBasis: '50%', display: 'flex', justifyContent:"center", alignItems:"center", padding: "0px 30px" }}>
                <img src={initPlot} alt='Plot of the data' width='auto' height='auto' style={{ maxWidth: '100%', maxHeight: '100%' }} onLoad={() => {}}/>
            </Box>
        </Flex>
    );
};

export default DataTab;