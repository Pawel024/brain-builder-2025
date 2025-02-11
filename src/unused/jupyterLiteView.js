import React from 'react';
import Header from '../common/header'; // Reusing the Header component from the provided example

class JupyterLite extends React.Component {
    render() {
        return (
            <div>
                <Header showHomeButton={true} />
                <iframe
                    src= '/static/_output/index.html'  // TODO: change this to the right URL
                    style={{  // TODO: check style
                        width: '100%',
                        height: 'calc(100vh - 50px)', 
                        border: 'none'
                    }}
                    title="JupyterLite Demo"
                ></iframe>
            </div>
        );
    }
}

export default JupyterLite;