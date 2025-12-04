import OpenAI from 'openai';

const OPENAI_API_KEY = 'paste here your key';

const client = new OpenAI({
     apiKey: OPENAI_API_KEY,
})

//tools
function getWeatherDetails(city) {
     if (city.toLowerCase() === 'new york') {
          return '10°C';
     }
     if (city.toLowerCase() === 'patiala') {
          return '14°C';
     }
     if (city.toLowerCase() === 'london') {
          return '19°C';
     }
     if (city.toLowerCase() === 'mohali') {
          return '10°C';
     }
     if (city.toLowerCase() === 'delhi') {
          return '15°C';
     }
}

// const user = 'What is the weather in Pune?';
// client.chat.completions.create({
//      model: 'gpt-3.5-turbo',
//      messages: [{ role: 'user', content: user }],
// }).then(e => {
//      console.log(e.choices[0].message);
// })

const SYSTEM_PROMPT = `
You are an AI assistant with START, PLAN, ACTION, OBSERVE, and OUTPUT states. Wait for thwe user propmpt and first PLAN using available tools. After plannning, take the ACTION with appropriate tool and wait for Observatuion based on the action. Once you get the observations, return the AI response based on START prompt and observations

Available Tools:
- function getWeatherDetails(city: string): string
getWeatherDetails is a function that accepts city name as string and returns the weather details

Example:
START
{ "type": "user", "user": "What is the sum of weather of Patiala and Mohali?" }
{ "type": "plan", "plan": "I will call the getWeatherDetails for Patiala" }
{ "type": "action", "function": "getWeatherDetails", "input": "patiala" }
{ "type": "observation", "observation": "10°C" }
{ "type": "plan", "plan": "I will call getWeatherDetails for Mohali" }
{ "type": "action", "function": "getWeatherDetails", "input": "mohali" }
{ "type": "observation", "observation": "10°C" }
{ "type": "output", "output": "The sum of weather of Patiala and Mohali is 24°C" }
`;

const user = 'Hey, What is weather of Patiala';

async function chat() {
     const result = await client.chat.completions.create({
          model: 'gpt-4',
          messages: [
               { role: 'system', content: SYSTEM_PROMPT },
               { role: 'user', content: user }],
     });
     console.log(result.choices[0].message.content);
}

chat();

// AUTOPROMPTING FUNCTION
async function autoPrompting(userMessage) {
     const messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
     ];

     let continueLoop = true;

     while (continueLoop) {
          const result = await client.chat.completions.create({
               model: 'gpt-4',
               messages: messages,
          });

          const responseContent = result.choices[0].message.content;
          console.log('AI Response:', responseContent);

          // Parse the response to extract actions
          const lines = responseContent.split('\n').filter(line => line.trim());
          let hasAction = false;

          for (const line of lines) {
               try {
                    const parsed = JSON.parse(line);

                    if (parsed.type === 'action') {
                         hasAction = true;
                         console.log(`Executing action: ${parsed.function} with input: ${parsed.input}`);

                         // Execute the action based on function name
                         let observation;
                         if (parsed.function === 'getWeatherDetails') {
                              observation = getWeatherDetails(parsed.input);
                         }

                         // Add observation to messages
                         messages.push({
                              role: 'assistant',
                              content: JSON.stringify({ type: 'observation', observation: observation })
                         });
                    } else if (parsed.type === 'output') {
                         console.log('Final Output:', parsed.output);
                         continueLoop = false;
                         break;
                    }
               } catch (e) {
                    // Skip lines that aren't valid JSON
               }
          }

          // If no action was found and no output, break to avoid infinite loop
          if (!hasAction && continueLoop) {
               continueLoop = false;
          }

          // Add assistant message to conversation history
          messages.push({
               role: 'assistant',
               content: responseContent
          });
     }
}

// Uncomment to test autoPrompting
// autoPrompting('What is the sum of weather of Patiala and Mohali?');
