```
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
method: 'POST',
headers: {
Authorization: `Bearer ${<OPENROUTER_API_KEY>}`,
'Content-Type': 'application/json',
},
body: JSON.stringify({
model: 'openai/gpt-5.4-image-2',
messages: [
{
"role": "user",
"content": "Generate a beautiful sunset over mountains"
}
],
modalities: ['image', 'text']
}),
});

const result = await response.json();

if (result.choices) {
const message = result.choices[0].message;
if (message.images) {
message.images.forEach((image, index) => {
const imageUrl = image.image_url.url; // Base64 data URL
console.log(`Generated image ${index + 1}: ${imageUrl.substring(0, 50)}...`);
});
}
}
```
