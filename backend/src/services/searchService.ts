import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SearchGroup {
  operator: 'AND' | 'OR';
  fields: SearchField[];
}

interface SearchField {
  entity: string;
  field: string;
  operator: string;
  value: string;
  type: string;
}

interface SearchResult {
  entity: string;
  id: string;
  title: string;
  description: string;
  score: number;
  data: any;
}

export const searchService = {
  // Advanced search
  advancedSearch: async (searchData: any) => {
    try {
      const { query, entities, groups } = searchData;
      const results: SearchResult[] = [];
      
      // If there's a general query, search across all entities
      if (query) {
        const generalResults = await searchService.searchGeneralQuery(query, entities);
        results.push(...generalResults);
      }
      
      // Process search groups
      if (groups && groups.length > 0) {
        for (const group of groups) {
          const groupResults = await searchService.processSearchGroup(group);
          results.push(...groupResults);
        }
      }
      
      // Remove duplicates and sort by score
      const uniqueResults = searchService.removeDuplicates(results);
      const sortedResults = uniqueResults.sort((a, b) => b.score - a.score);
      
      return {
        results: sortedResults,
        total: sortedResults.length
      };
    } catch (error) {
      console.error('Error in advanced search:', error);
      throw error;
    }
  },

  // Quick search
  quickSearch: async (query: string, entity?: string, limit: number = 10) => {
    try {
      const results: SearchResult[] = [];
      
      if (entity) {
        const entityResults = await searchService.searchEntity(query, entity, limit);
        results.push(...entityResults);
      } else {
        // Search across all entities
        const entities = ['customers', 'units', 'contracts', 'partners', 'brokers', 'safes'];
        for (const ent of entities) {
          const entityResults = await searchService.searchEntity(query, ent, Math.ceil(limit / entities.length));
          results.push(...entityResults);
        }
      }
      
      return results.slice(0, limit);
    } catch (error) {
      console.error('Error in quick search:', error);
      throw error;
    }
  },

  // Get search suggestions
  getSuggestions: async (query: string, entity?: string) => {
    try {
      const suggestions: string[] = [];
      
      if (entity) {
        const entitySuggestions = await searchService.getEntitySuggestions(query, entity);
        suggestions.push(...entitySuggestions);
      } else {
        // Get suggestions from all entities
        const entities = ['customers', 'units', 'contracts', 'partners', 'brokers'];
        for (const ent of entities) {
          const entitySuggestions = await searchService.getEntitySuggestions(query, ent);
          suggestions.push(...entitySuggestions);
        }
      }
      
      return [...new Set(suggestions)].slice(0, 10);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  },

  // Search general query across entities
  searchGeneralQuery: async (query: string, entities: string[]) => {
    const results: SearchResult[] = [];
    
    for (const entity of entities) {
      const entityResults = await searchService.searchEntity(query, entity, 20);
      results.push(...entityResults);
    }
    
    return results;
  },

  // Search specific entity
  searchEntity: async (query: string, entity: string, limit: number) => {
    try {
      const results: SearchResult[] = [];
      
      switch (entity) {
        case 'customers':
          const customers = await prisma.customer.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
                { nationalId: { contains: query, mode: 'insensitive' } },
                { address: { contains: query, mode: 'insensitive' } }
              ],
              deletedAt: null
            },
            take: limit
          });
          
          customers.forEach(customer => {
            results.push({
              entity: 'customers',
              id: customer.id,
              title: customer.name,
              description: `${customer.phone || ''} - ${customer.address || ''}`.trim(),
              score: searchService.calculateScore(query, customer.name),
              data: customer
            });
          });
          break;
          
        case 'units':
          const units = await prisma.unit.findMany({
            where: {
              OR: [
                { code: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } },
                { unitType: { contains: query, mode: 'insensitive' } },
                { area: { contains: query, mode: 'insensitive' } },
                { building: { contains: query, mode: 'insensitive' } }
              ],
              deletedAt: null
            },
            take: limit
          });
          
          units.forEach(unit => {
            results.push({
              entity: 'units',
              id: unit.id,
              title: `${unit.code} - ${unit.name || 'بدون اسم'}`,
              description: `${unit.unitType} - ${unit.area || ''} - ${unit.building || ''}`.trim(),
              score: searchService.calculateScore(query, unit.code),
              data: unit
            });
          });
          break;
          
        case 'contracts':
          const contracts = await prisma.contract.findMany({
            where: {
              OR: [
                { brokerName: { contains: query, mode: 'insensitive' } }
              ],
              deletedAt: null
            },
            include: {
              customer: true,
              unit: true
            },
            take: limit
          });
          
          contracts.forEach(contract => {
            results.push({
              entity: 'contracts',
              id: contract.id,
              title: `عقد ${contract.unit.code}`,
              description: `${contract.customer.name} - ${contract.brokerName || ''}`.trim(),
              score: searchService.calculateScore(query, contract.brokerName || ''),
              data: contract
            });
          });
          break;
          
        case 'partners':
          const partners = await prisma.partner.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } }
              ],
              deletedAt: null
            },
            take: limit
          });
          
          partners.forEach(partner => {
            results.push({
              entity: 'partners',
              id: partner.id,
              title: partner.name,
              description: partner.phone || '',
              score: searchService.calculateScore(query, partner.name),
              data: partner
            });
          });
          break;
          
        case 'brokers':
          const brokers = await prisma.broker.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } }
              ],
              deletedAt: null
            },
            take: limit
          });
          
          brokers.forEach(broker => {
            results.push({
              entity: 'brokers',
              id: broker.id,
              title: broker.name,
              description: broker.phone || '',
              score: searchService.calculateScore(query, broker.name),
              data: broker
            });
          });
          break;
          
        case 'safes':
          const safes = await prisma.safe.findMany({
            where: {
              name: { contains: query, mode: 'insensitive' }
            },
            take: limit
          });
          
          safes.forEach(safe => {
            results.push({
              entity: 'safes',
              id: safe.id,
              title: safe.name,
              description: `الرصيد: ${safe.balance}`,
              score: searchService.calculateScore(query, safe.name),
              data: safe
            });
          });
          break;
      }
      
      return results;
    } catch (error) {
      console.error(`Error searching entity ${entity}:`, error);
      return [];
    }
  },

  // Get entity suggestions
  getEntitySuggestions: async (query: string, entity: string) => {
    try {
      const suggestions: string[] = [];
      
      switch (entity) {
        case 'customers':
          const customers = await prisma.customer.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } }
              ],
              deletedAt: null
            },
            select: { name: true, phone: true },
            take: 5
          });
          
          customers.forEach(customer => {
            if (customer.name) suggestions.push(customer.name);
            if (customer.phone) suggestions.push(customer.phone);
          });
          break;
          
        case 'units':
          const units = await prisma.unit.findMany({
            where: {
              OR: [
                { code: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } }
              ],
              deletedAt: null
            },
            select: { code: true, name: true },
            take: 5
          });
          
          units.forEach(unit => {
            if (unit.code) suggestions.push(unit.code);
            if (unit.name) suggestions.push(unit.name);
          });
          break;
      }
      
      return suggestions;
    } catch (error) {
      console.error(`Error getting suggestions for entity ${entity}:`, error);
      return [];
    }
  },

  // Process search group
  processSearchGroup: async (group: SearchGroup) => {
    const results: SearchResult[] = [];
    
    for (const field of group.fields) {
      const fieldResults = await searchService.searchField(field);
      results.push(...fieldResults);
    }
    
    return results;
  },

  // Search specific field
  searchField: async (field: SearchField) => {
    try {
      const { entity, field: fieldName, operator, value, type } = field;
      
      // This would need to be implemented based on the specific field and operator
      // For now, return empty results
      return [];
    } catch (error) {
      console.error('Error searching field:', error);
      return [];
    }
  },

  // Calculate search score
  calculateScore: (query: string, text: string) => {
    if (!text) return 0;
    
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    if (textLower === queryLower) return 1.0;
    if (textLower.startsWith(queryLower)) return 0.9;
    if (textLower.includes(queryLower)) return 0.7;
    
    // Calculate similarity based on common characters
    const commonChars = queryLower.split('').filter(char => textLower.includes(char)).length;
    return commonChars / query.length;
  },

  // Remove duplicates from results
  removeDuplicates: (results: SearchResult[]) => {
    const seen = new Set();
    return results.filter(result => {
      const key = `${result.entity}-${result.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  },

  // Get search history
  getSearchHistory: async (userId: string, limit: number) => {
    try {
      // This would need a search history table in the database
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting search history:', error);
      throw error;
    }
  },

  // Save search history
  saveSearchHistory: async (data: any) => {
    try {
      // This would need a search history table in the database
      // For now, return the data
      return data;
    } catch (error) {
      console.error('Error saving search history:', error);
      throw error;
    }
  },

  // Delete search history
  deleteSearchHistory: async (id: string, userId: string) => {
    try {
      // This would need a search history table in the database
      // For now, return true
      return true;
    } catch (error) {
      console.error('Error deleting search history:', error);
      throw error;
    }
  },

  // Get search analytics
  getSearchAnalytics: async (period: string) => {
    try {
      // This would need search analytics data
      // For now, return mock data
      return {
        totalSearches: 0,
        popularQueries: [],
        searchTrends: [],
        entityBreakdown: {}
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      throw error;
    }
  }
};