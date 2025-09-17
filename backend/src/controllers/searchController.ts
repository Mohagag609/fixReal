import { Request, Response } from 'express';
import { searchService } from '../services/searchService';
import { validateSearchQuery } from '../validations/searchValidation';

export const searchController = {
  // Advanced search
  advancedSearch: async (req: Request, res: Response) => {
    try {
      const { error, value } = validateSearchQuery(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'بيانات البحث غير صحيحة',
          errors: error.details
        });
      }

      const results = await searchService.advancedSearch(value);
      
      res.json({
        success: true,
        data: results,
        message: 'تم البحث بنجاح'
      });
    } catch (error) {
      console.error('Error in advanced search:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في البحث',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Quick search
  quickSearch: async (req: Request, res: Response) => {
    try {
      const { q, entity, limit = 10 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'استعلام البحث مطلوب'
        });
      }

      const results = await searchService.quickSearch(q as string, entity as string, Number(limit));
      
      res.json({
        success: true,
        data: results,
        message: 'تم البحث السريع بنجاح'
      });
    } catch (error) {
      console.error('Error in quick search:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في البحث السريع',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Get search suggestions
  getSuggestions: async (req: Request, res: Response) => {
    try {
      const { q, entity } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'استعلام البحث مطلوب'
        });
      }

      const suggestions = await searchService.getSuggestions(q as string, entity as string);
      
      res.json({
        success: true,
        data: suggestions,
        message: 'تم جلب الاقتراحات بنجاح'
      });
    } catch (error) {
      console.error('Error getting suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الاقتراحات',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Get search history
  getSearchHistory: async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const { limit = 20 } = req.query;
      
      const history = await searchService.getSearchHistory(userId, Number(limit));
      
      res.json({
        success: true,
        data: history,
        message: 'تم جلب تاريخ البحث بنجاح'
      });
    } catch (error) {
      console.error('Error getting search history:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب تاريخ البحث',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Save search history
  saveSearchHistory: async (req: Request, res: Response) => {
    try {
      const { userId, query, entity, results } = req.body;
      
      const history = await searchService.saveSearchHistory({
        userId,
        query,
        entity,
        results
      });
      
      res.json({
        success: true,
        data: history,
        message: 'تم حفظ البحث في التاريخ بنجاح'
      });
    } catch (error) {
      console.error('Error saving search history:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حفظ البحث في التاريخ',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Delete search history
  deleteSearchHistory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      const deleted = await searchService.deleteSearchHistory(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'عنصر التاريخ غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف البحث من التاريخ بنجاح'
      });
    } catch (error) {
      console.error('Error deleting search history:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حذف البحث من التاريخ',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Get search analytics
  getSearchAnalytics: async (req: Request, res: Response) => {
    try {
      const { period = '30d' } = req.query;
      
      const analytics = await searchService.getSearchAnalytics(period as string);
      
      res.json({
        success: true,
        data: analytics,
        message: 'تم جلب إحصائيات البحث بنجاح'
      });
    } catch (error) {
      console.error('Error getting search analytics:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب إحصائيات البحث',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};