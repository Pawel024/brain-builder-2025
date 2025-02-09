import React from 'react';
import './css/App.css';
import { Theme, Box, Heading, Flex } from '@radix-ui/themes';
import{ safeGet } from './utils/axiosUtils';
import Header from './common/header';

class Introduction extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          content: [],
          showContent: [],
          printedContent: '',
          currentSlide: 0,
        }
    }

    goToSlide = (index) => {
      this.setState({ currentSlide: index });
    };

    handleShowContent = (index, expand) => {
      if (expand) {
        //set showContent[index] to true hence expand the content
        this.setState({ showContent: this.state.showContent.map((value, i) => i === index ? true : false) });
      } else {
        //set showContent[index] to false hence collapse the content
        this.setState({ showContent: this.state.showContent.map((value, i) => i === index ? false : value) });
      }
    };

    typeWriter = (txt, speed=15, i=0) => {
        if (i < txt.length) {
          this.setState({ printedContent: this.state.printedContent + txt.charAt(i)})
          setTimeout(() => this.typeWriter(txt, speed, i + 1), speed);
        }
      };

    componentDidMount() {
        safeGet(window.location.origin + '/api/intros/?intro_id=' + this.props.introId)
        .then(response => {
        if (response.data.content[0] === '[') {
            this.setState({ content: JSON.parse(response.data.content),
              showContent: Array(JSON.parse(response.data.content).length).fill(false)
            }, () => {
              const urlParams = new URLSearchParams(window.location.search);
              const openBox = urlParams.get('section');
              if (openBox !== null) {
                this.handleShowContent(parseInt(openBox), true);
              }
            });
        } else if (response.data.content[0] === '*') {
          this.typeWriter(response.data.content);  // this works
        } else {
          this.createDescriptionList(response.data.content);
        }
        })
        .catch(error => {
        console.error('Introduction error:', error);
        this.typeWriter("There was an error loading the introduction.");
        });
    }

  createDescriptionList = (jsonText) => {
    try {
      const sanitizedJson = jsonText.replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/&/g, "&amp;")
        .replace(/%/g, "&#37;")
        .replace(/#/g, "&#35;")
        .replace(/!/g, "&#33;")
        .replace(/\?/g, "&#63;")
        .replace(/'/g, "&#39;")
        .replace(/"/g, "&quot;");
      const splitText = sanitizedJson.split('\n ');
      const descriptionList = splitText.map(subText => {
        const [subtitle, ...paragraphs] = subText.split('\n');
        const formattedParagraphs = paragraphs.map(paragraph => 
          paragraph.replace(/\*([^*]+)\*/g, '<b>$1</b>') // bold
          .replace(/_([^_]+)_/g, '<i>$1</i>') // italic
        );
        return [subtitle, ...formattedParagraphs];
      });
      this.setState({ content: descriptionList, showContent: Array(descriptionList.length).fill(false) });
      const urlParams = new URLSearchParams(window.location.search);
      const openBox = urlParams.get('section');
      if (openBox !== null) {
        this.handleShowContent(parseInt(openBox), true);
      }
    } catch (error) {
      console.error('Error parsing JSON or formatting description:', error);
    }
  }

    render () { return(
    <Theme accentColor="cyan" grayColor="slate" panelBackground="solid" radius="large" appearance='light'>
        <Header showHomeButton={true} />

        {this.props.taskId !== 0 && (
          <Box style={{ overflow: 'auto', width: '100%', height: window.innerHeight-52, padding: '30px 300px', backgroundImage: 'linear-gradient(330deg, rgba(7,62,185, 0.15) 0%, rgba(7,185,130, 0.15) 100%)' }}>
            {this.state.content.length > 0 ? (
              <Flex direction="column" gap="3" style={{ width: '100%', height: '100%'}}>
                {this.state.content.map(([subtitle, ...paragraphs], index) => (
                  <Box style={{ boxShadow: '0 2px 8px var(--slate-a10)', borderRadius: "var(--radius-3)", padding: '10px 24px', textAlign: 'justify', backgroundColor: this.state.showContent[index] ? 'white' : 'white', cursor: 'pointer' }}
                    onClick={this.state.showContent[index] ? () => this.handleShowContent(index, false) : () => this.handleShowContent(index, true)}
                  >
                    <Flex direction="column" style={{ textAlign: 'justify', marginBottom: this.state.showContent[index] ? 10 : 0 }}>
                      <Heading as='h2' size='5' style={{ color: 'var(--slate-12)', marginBottom:7, textAlign: 'start' }}>&gt;_{subtitle} </Heading>
                      { this.state.showContent[index] && paragraphs.map((paragraph, i) => (
                        <p key={i} dangerouslySetInnerHTML={{ __html: paragraph }} style={{ marginBottom: 0, textAlign: 'justify' }}></p>
                      ))}
                    </Flex>
                  </Box>
                ))}
              </Flex>
            ) : (
              <div style={{ textAlign:'justify' }}>
                <Heading as='h2' size='5' style={{ color: 'var(--slate-12)', marginBottom:7 }}>&gt;_Key Concepts </Heading>
                {this.state.printedContent}
              </div>
            )}
          </Box>
        )}
    </Theme>
    )}
}

export default Introduction;