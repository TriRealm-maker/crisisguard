import { Request, Response } from 'express';
import { getDisasterPrediction, getDisasterGuide } from '../services/aiService';

export const getPrediction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ message: 'Latitude and longitude are required' });
      return;
    }

    const prediction = await getDisasterPrediction(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    res.json({ prediction });
  } catch (error) {
    res.status(500).json({ message: 'Error generating prediction', error: (error as Error).message });
  }
};

export const getGuide = async (req: Request, res: Response): Promise<void> => {
  try {
    const { disaster } = req.query;

    if (!disaster) {
      res.status(400).json({ message: 'Disaster type is required' });
      return;
    }

    const guide = await getDisasterGuide(disaster as string);
    res.json({ guide });
  } catch (error) {
    res.status(500).json({ message: 'Error generating guide', error: (error as Error).message });
  }
};
