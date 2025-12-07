import React from 'react';
import './css/App.css';
import { Theme, Box, IconButton, Flex } from '@radix-ui/themes';
import { PlayIcon } from '@radix-ui/react-icons';
import { safeGet } from '../utils/axiosUtils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import a11yDark from '../code_preview/a11y-dark';
import Header from '../common/header';

class NotebookView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            notebook: null,
            currentCell: 0,
            cellContents: [],
            cellOutputs: {}, // Added a new state to track outputs for each cell
        };
        this.ws = new WebSocket(`wss://${this.props.host}/code/${this.props.userId}/`);
    }

    componentDidMount() {
        let notebookUrl = `/api/notebooks/${this.props.notebookPath}/`;

        safeGet(notebookUrl)
            .then(response => {
                this.setState({ notebook: response.data });
                this.setState({ cellContents: response.data.cells.map(cell => cell.source.join('')) });
            })
            .catch(error => {
                console.error('Error loading notebook:', error);
            });

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        this.ws.onopen = () => {
            console.log('WebSocket connection opened');
        }

        this.ws.onerror = (error) => {
            console.log('WebSocket error: ', error);
        }

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.header === "output" && data.notebook_id === this.props.notebookPath) {
                    let cellIndex = 1; // TODO: Replace this with the actual cell index
                    const newCellOutputs = { ...this.state.cellOutputs, [cellIndex]: data.output };
                    this.setState({ cellOutputs: newCellOutputs });
                    // Now, cellOutputs state will hold the output for each cell by its index
                }
            } catch (error) {
                console.error('Error receiving message:', error);
            }
        }
    }

    componentWillUnmount() {
        this.ws.close();
    }

    handleClick = (index) => {
        console.log("Clicked cell", index);
        if (this.ws.readyState === this.ws.OPEN && this.state.notebook) {
            this.setState({ currentCell: index });
            const data = {
                header: 'code',
                notebook_id: this.props.notebookPath,
                // code: this.state.notebook.cells[index].source.join(''),
                code: this.state.cellContents[index],
                cell: index,
            };
            try {this.ws.send(JSON.stringify(data));}
            catch (error) {console.error('Error sending message:', error);}
        }
    }

    handleContentChange = (index, newContent) => {
        const newCellContents = this.state.cellContents.slice();
        newCellContents[index] = newContent;
        this.setState({ cellContents: newCellContents });
    }

    render() {
        // this.ws.onmessage = (event) => {
        //     console.log('ws message received');
        //     try {
        //         const data = JSON.parse(event.data);
        //         if (data.header == "output" && data.notebook_id == this.props.notebookPath) {
        //             alert(data.output)
        //             // TODO: handle the message
        //         }
        //     } catch (error) {console.error('Error receiving message:', error);}
        // }

        return(
            <Theme accentColor="cyan" grayColor="slate" panelBackground="solid" radius="large" appearance='light'>
                <Flex direction='column' style={{ width: '100%' }}>
                    <Header showHomeButton={true} />
                    <Box style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: window.innerHeight-52, fontFamily: 'monospace', backgroundImage: 'linear-gradient(330deg, rgba(7,62,185, 0.15) 0%, rgba(7,185,130, 0.15) 100%)'}}>
                        <Flex direction='column' gap='3' style={{padding:'10px 10px', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            {this.state.notebook === null && <div>Loading...</div>}
                            {this.state.notebook !== null && this.state.notebook.cells.map((cell, index) => (
                                <Box style={{ boxShadow: '0 2px 8px var(--slate-a11)', borderRadius: "var(--radius-3)", width:window.innerWidth/2, padding: '30px 50px', background:"solid", backgroundColor:"white", cursor: 'pointer'}} key={index}>
                                    {cell.cell_type === 'markdown' ? (
                                    <MarkdownCell cell={cell} content={this.state.cellContents[index]} onContentChange={(newContent) => this.handleContentChange(index, newContent)} style={{ margin: '10px' }} />
                                    ) : (cell.cell_type === 'code' && (
                                    <CodeCell cell={cell} content={this.state.cellContents[index]} output={this.state.cellOutputs[index] || ''} onContentChange={(newContent) => this.handleContentChange(index, newContent)} handleClick={() => this.handleClick(index)} style={{ margin: '10px' }} />
                                    ))}
                                </Box>
                                ))}
                        </Flex>
                    </Box>
                </Flex>
            </Theme>
        )
    }
}

class MarkdownCell extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isEditing: false,
            newContent: '',
        };
        this.textareaRef = React.createRef();
    }

    componentDidMount() {
        this.setState({ newContent: this.props.cell.source.join('') });
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.isEditing && !prevState.isEditing) {
            this.textareaRef.current.focus(); // Automatically focus the textarea when entering edit mode
            this.adjustTextareaHeight(); // Adjust the height of the textarea
        }
    }

    adjustTextareaHeight = () => {
        const textarea = this.textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px'; // Dynamically adjust the height based on content
    }

    handleClick = () => {
        this.setState({ isEditing: true });
    }

    handleChange = (event) => {
        this.setState({ newContent: event.target.value }, this.adjustTextareaHeight); // Adjust height on content change
    }

    handleBlur = () => {
        this.setState({ isEditing: false });
        this.props.onContentChange(this.state.newContent); // Ensure content is updated on blur
    }

    handleKeyDown = (event) => {
        if (this.state.isEditing && event.key === "Enter") {
            event.preventDefault();
            this.setState({ isEditing: false });
            this.props.onContentChange(this.state.newContent);
        } 
    }

    render() {
        const textareaStyle = {
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            resize: 'none',
            fontFamily: '"Fira Code", monospace',
            lineHeight: '1.5',
            height: 'auto', // Initial height auto, will be adjusted dynamically
            overflow: 'hidden' // Hide the scrollbar
        };

        return (
            <div className="markdown-cell" onClick={this.handleClick} >
                {this.state.isEditing ? (
                        <textarea 
                            ref={this.textareaRef}
                            value={this.state.newContent} 
                            onChange={this.handleChange} 
                            onBlur={this.handleBlur} 
                            onKeyDown={this.handleKeyDown} 
                            style={textareaStyle}
                        />
                    ) : (
                        <ReactMarkdown>{this.state.newContent}</ReactMarkdown> // Use newContent to reflect the latest changes
                    )}
            </div>
        );
    }
}

class CodeCell extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isEditing: false,
            newContent: '',
        };
        this.textareaRef = React.createRef();
    }

    componentDidMount() {
        this.setState({ newContent: this.props.cell.source.join('') });
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.isEditing && !prevState.isEditing) {
            this.textareaRef.current.focus();
            this.adjustTextareaHeight();
        }
    }

    adjustTextareaHeight = () => {
        const textarea = this.textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    handleChange = (event) => {
        this.setState({ newContent: event.target.value }, this.adjustTextareaHeight);
    }

    handleBlur = () => {
        this.setState({ isEditing: false, newContent: this.state.newContent });
    }

    handleKeyDown = (event) => {
        if (this.state.isEditing && event.key === "Enter") {
            event.preventDefault();
            this.setState({ isEditing: false });
        } 
    }

    render() {
        const textareaStyle = {
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            resize: 'none',
            fontFamily: '"Fira Code", monospace',
            lineHeight: '1.5',
            marginTop: '7px',
            marginBottom: '7px',
        };

        return (
            <Flex direction="column" gap="2" className="code-cell" >
                <Flex direction="row" gap="2">
                    <PlayButton onClick={this.props.handleClick} style={{ marginLeft: -10 }}/>
                    <div style={{ flex: 2, overflow: 'auto' }} onClick={() => this.setState({ isEditing: true })} >
                        {this.state.isEditing ? (
                            <textarea 
                                ref={this.textareaRef}
                                value={this.state.newContent} 
                                onChange={this.handleChange} 
                                onBlur={this.handleBlur} 
                                onKeyDown={this.handleKeyDown} 
                                style={textareaStyle}
                            />
                        ) : (
                            <SyntaxHighlighter language="python" style={a11yDark} >
                                {this.props.content}
                            </SyntaxHighlighter>
                        )}
                    </div>
                </Flex>
                <Box style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>
                    <strong>Output:</strong>
                    <pre>{this.props.output}</pre>
                </Box>
            </Flex>
        );
    }
}

class PlayButton extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <IconButton onClick={this.props.onClick} style={{ backgroundColor: 'var(--cyan-10)', color: 'var(--cyan-1)', width: window.innerWidth/50, height: window.innerWidth/50, marginBottom: 7, marginTop: 7 }}><PlayIcon /></IconButton>
        );
    }
}

export default NotebookView;