import { PlayIcon } from '@radix-ui/react-icons';
import { Flex, IconButton, TextField } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import '../../css/App.css';
import * as RadioGroup from '@radix-ui/react-radio-group';

const EI = 0.3;  // gCO2e/Wh, carbon intensity of electricity in the EU (source: https://ourworldindata.org/grapher/carbon-intensity-electricity?tab=chart&country=EU-27~OWID_EU27~OWID_WRL)
const CP = 20;  // Wh/h, average power consumption of a laptop per hour (source: specs of ZBook Power G9)
const T = 0.35/60/60;  // h/word, time for chatGPT to generate a word (source: see below)
const AIP = 400;  // W, power consumption of an A100 GPU in an Azure datacenter (source: see below)
const AIM = 1.84+0.03; // gCO2e/query, the share of emissions from training the model + operating the server (source: https://www.nature.com/articles/s41598-024-54271-x)
const GE = 0.2; // gCO2e/Wh, carbon intensity of a Google search (source: https://googleblog.blogspot.com/2009/01/powering-google-search.html)


/**
 * Calculates carbon emissions for writing text with and without AI assistance
 * 
 * @param {number} n_words - Number of words in the text
 * @param {number} own_time_mins - Time spent writing in minutes
 * @param {number} proofread_time_mins - Time spent proofreading in minutes
 * @returns {[number, number]} Array containing [human emissions, AI emissions] in gCO2e
 */
function calculateWritingEmissions(n_words, own_time_mins, proofread_time_mins) {
    let own_emissions = (own_time_mins+proofread_time_mins)/60*CP*EI;  // in gCO2e
    let AI_emissions = AIM + n_words*T*AIP*EI + proofread_time_mins/60*CP*EI;  // in gCO2e
    return [own_emissions, AI_emissions]; 
}

/*
function calculateSearchingEmissions( n_searches, n_pages, mins_per_page, short=false ) {
    if (short) {
        let n_words = 20  // a rough estimate of a ChatGPT answer to a simple question (eg. "How tall is the Eiffel Tower?")
        return ( GE, n_words*T*AIP*EI )  // emissions for Google Search, emissions for ChatGPT answer (in gCO2e)
    } else {
        let n_words = 400  // a rough estimate of a ChatGPT answer to a more complex question, (eg. "How do I calculate the bending stiffness of a wing?")
        let n_prompts = 1
        return ( n_searches*GE + n_pages*mins_per_page/60*CP*EI, n_prompts*n_words*T*AIP*EI + n_prompts*mins_per_page/60*CP*EI )  // emissions for Google Search, emissions for ChatGPT answer (in gCO2e)
    }
} 
*/

// note: I left out the emissions for maintaining the webpages, since these were hard to find
// note: in general, this is a rough estimate, but at least it gives people an idea
// for more details on emissions calculation, see this blog post: https://medium.com/@chrispointon/the-carbon-footprint-of-chatgpt-e1bc14e4cc2a


/**
 * Renders text with input fields interspersed
 * 
 * @param {string[]} textList - Array of text segments
 * @param {JSX.Element[]} inputFields - Array of input field components
 * @returns {JSX.Element} Combined text and input fields
 */
function renderText(textList, inputFields) {
    return (
        <div>
            {textList.map((text, index) => (
                <p key={index}>{text}{inputFields[index]}</p>
            ))}
        </div>
    );
}


/**
 * Renders the emissions calculator component
 * 
 * @param {object} props - Component properties
 * @param {number} props.width - Component width
 * @param {number} props.height - Component height
 * @param {[any, Function]} props.states - State array [result, setResult]
 * @param {[any, Function, Function]} props.stateSetter - State setters [ins, updateTime, updateWords]
 * @returns {JSX.Element} Emissions calculator component
 */
export function RenderEmissions({ width, height, states, stateSetter }) {
    
    const [result, setResult] = states;
    const [ins, updateTime, updateWords, writing=true] = stateSetter;
    
    if (writing) {
        const timeValues = ins[1] === null ? [null, null] : ins[1];
        
        const options = ['a sentence (~30 words)', 'a paragraph (~100 words)', 'a page (~400 words)'];

        const inputs = [
            <RadioGroup.Root className="RadioGroupRoot" defaultValue="1" aria-label="Length of text" onValueChange={(value) => updateWords(options[parseInt(value, 10)-1])}>
                {options.map((option, index) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                    <RadioGroup.Item className="RadioGroupItem" value={index.toString()} key={index}>
                        <RadioGroup.Indicator className="RadioGroupIndicator" />
                    </RadioGroup.Item>
                    <label className="Label" htmlFor="r1">
                        {option}
                    </label>
                    </div>
                ))}
            </RadioGroup.Root>,
            <TextField
                label="Minutes"
                type="number"
                size="2"
                onValueChange={(newValue) => updateTime(newValue, timeValues[1])}
            />,
            <TextField
                label="Minutes"
                type="number"
                size="2"
                onValueChange={(newValue) => updateTime(timeValues[0], newValue)}
            />,
        ]
        const texts = [
            "Writing an initial draft of ", "takes me about ", " minutes, and proofreading it takes me about ", " minutes. ",
        ]
        return (
            <Flex direction='column' gap="0" style={{ alignItems: 'center', justifyContent: 'center' }}>
                {renderText( texts, inputs )}
                <IconButton onClick={
                    () => setResult(calculateWritingEmissions(ins[0], parseInt(timeValues[0]), parseInt(timeValues[1])))
                } variant="solid" color="cyan" style={{ borderRadius: 'var(--radius-3)', width: 70, height: 35, fontSize: 'var(--font-size-2)', fontWeight: "500" }} >
                    <PlayIcon />
                </IconButton>
                {(result[0] !== null  && result[1] !== null) ?
                <div style={{ marginTop:20 }}>
                <p> Emissions from writing yourself: {Math.round(result[0], 0.1)} g CO2e </p>
                <p> Emissions from writing with ChatGPT: {Math.round(result[1], 0.1)} g CO2e </p>
                </div> : null}
            </Flex>
        );
    }

}