import Job from '../models/jobModel.js';
import fetch from 'node-fetch';

/**
 * Process job details through OpenRouter AI and save to database
 * @route POST /api/jobs/process
 * @access Public
 */
export const processJobDetails = async (req, res) => {
  try {
    const { jobDetails } = req.body;
    
    if (!jobDetails) {
      return res.status(400).json({ success: false, message: 'Job details are required' });
    }

    // Prepare the prompt for OpenRouter AI
    const prompt = `
      Create a job posting JSON based on the following details. Follow this exact schema without using placeholder data:
      ${JSON.stringify(Job.schema.obj, null, 2)}
      
      Job Details:
      ${jobDetails}
      
      Generate a complete JSON without any placeholder values. Use empty strings where necessary if information is not provided.
      Make sure to generate a unique slug by combining the job title, company name with today's date. Make sure the slug is URL-friendly.
      Ensure the JSON is valid and well-structured. Make sure the job details are professional as the website is in production
      Do not include any explanations, just return valid JSON. Exclude createdAt and updatedAt fields from the JSON.
    `;

    // Call OpenRouter AI API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Job Portal'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo', // Use default model if not specified
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates structured job posting data in JSON format.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json();
      console.error('OpenRouter API error:', errorData);
      return res.status(500).json({ success: false, message: 'Failed to process with AI', error: errorData });
    }

    const aiResponse = await openRouterResponse.json();
    
    // Extract the generated JSON from the AI response
    let jobData;
    try {
      const aiContent = aiResponse.choices[0].message.content;
      // Extract JSON from potential markdown or text format
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/({[\s\S]*})/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
      jobData = JSON.parse(jsonString.trim());
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to parse AI response', 
        aiResponse,
        error: error.message 
      });
    }
    
    // Generate a slug if it's missing
    if (!jobData.slug) {
      const date = new Date();
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
      jobData.slug = `${jobData.title.toLowerCase().replace(/\s+/g, '-')}-${formattedDate}`;
    }

    // Create and save the job in the database
    const job = new Job(jobData);
    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job processed and saved successfully',
      job
    });
  } catch (error) {
    console.error('Error in job processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and save job',
      error: error.message
    });
  }
};

/**
 * Get all jobs
 * @route GET /api/jobs
 * @access Public
 */
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
};