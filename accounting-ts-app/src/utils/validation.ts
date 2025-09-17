import { Request, Response, NextFunction } from 'express';

export const validateId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const numId = parseInt(id);
  
  if (isNaN(numId) || numId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }
  
  req.params.id = numId.toString();
  next();
};

export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters',
    });
  }
  
  req.query.page = page.toString();
  req.query.limit = limit.toString();
  next();
};

export const validateDateRange = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Start date and end date are required',
    });
  }
  
  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format',
    });
  }
  
  if (start > end) {
    return res.status(400).json({
      success: false,
      message: 'Start date must be before end date',
    });
  }
  
  next();
};