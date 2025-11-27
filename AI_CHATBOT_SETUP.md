# AI Chatbot Setup Guide

## Overview
The AI Chatbot feature has been implemented using Google's Gemini API. The chatbot appears as a floating button in the bottom-right corner of the customer interface and provides intelligent assistance to users.

## Setup Instructions

### 1. Get Your Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click on "Get API Key" button
3. Select "Create API key in new project" or use an existing project
4. Copy the generated API key

### 2. Configure the API Key

The `.env.local` file has been created in the project root. Add your API key:

```
VITE_GOOGLE_GEMINI_API_KEY=your_actual_api_key_here
```

Replace `your_actual_api_key_here` with the API key you copied from Google AI Studio.

### 3. Restart the Development Server

After updating the `.env.local` file:

1. Stop the current dev server (Ctrl+C)
2. Run `npm run dev` again
3. The chatbot should now be functional

## Features

- **Floating Chat Button**: Located in the bottom-right corner of the customer interface
- **Conversation History**: The chatbot maintains context from the entire conversation
- **Safety Settings**: Built-in content filtering for harmful content
- **Real-time Responses**: Uses Google Gemini 1.5 Flash model for fast responses
- **Error Handling**: Graceful error messages if API is unavailable

## How to Use

1. Click the blue chat bubble in the bottom-right corner
2. Type your message and press Enter or click the Send button
3. The AI assistant will respond with helpful information about services, bookings, and marketplace features

## Troubleshooting

### "API key not configured" error
- Ensure the `.env.local` file exists in the project root
- Verify the `VITE_GOOGLE_GEMINI_API_KEY` is set correctly
- Restart the dev server after adding the API key

### "Failed to get AI response" error
- Check that your API key is valid and active
- Ensure you have API quota remaining in your Google Cloud project
- Check browser console for detailed error messages

### Chatbot not appearing
- Make sure you're in "customer" mode (not provider mode)
- The chatbot only appears when not in the chat screen
- Check browser console for any JavaScript errors

## API Details

- **Model**: gemini-1.5-flash (fast and efficient)
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Max Tokens**: 1024 (response length limit)
- **Safety Filters**: Enabled for harassment, hate speech, explicit content, and dangerous content

## Security Notes

- Never commit the `.env.local` file to version control
- The API key is used only for client-side requests to Google's API
- Consider using API key restrictions in Google Cloud Console for production
