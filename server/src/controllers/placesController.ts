import { Request, Response } from 'express';
import { getNearbyPlaces } from '../services/placesService';

export const getPlaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ message: 'Latitude and longitude are required' });
      return;
    }

    const places = await getNearbyPlaces(
      parseFloat(lat as string),
      parseFloat(lng as string),
      radius ? parseInt(radius as string) : 10000
    );

    res.json(places);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching places', error: (error as Error).message });
  }
};
