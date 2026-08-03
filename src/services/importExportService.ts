import { z } from 'zod';
import Papa from 'papaparse';
import { UserMedia, AnimeStatus } from '../hooks/useAnimeList';

export const AnimeStatusSchema = z.enum(['WATCHING', 'COMPLETED', 'PLANNING', 'DROPPED', 'READING']);
export const MediaTypeSchema = z.enum(['ANIME', 'MANGA']);

// Zod Schema for robust validation of anime/manga items
export const UserMediaSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  image: z.string().url().optional().or(z.literal('')),
  type: MediaTypeSchema.default('ANIME'),
  status: AnimeStatusSchema,
  progress: z.number().int().min(0).default(0),
  totalProgress: z.number().int().min(0).optional().nullable(),
  score: z.number().min(0).max(10).optional().nullable(),
  genres: z.array(z.string()).optional(),
  updatedAt: z.string().optional()
});

export const UserMediaListSchema = z.array(UserMediaSchema);

export interface ImportResult {
  success: boolean;
  data: UserMedia[];
  errors: Array<{ row: number; field: string; message: string }>;
}

export const importExportService = {
  // Export as JSON
  exportToJSON(list: UserMedia[]): string {
    return JSON.stringify(list, null, 2);
  },

  // Export as CSV
  exportToCSV(list: UserMedia[]): string {
    const csvData = list.map(item => ({
      ID: item.id,
      Title: item.title,
      Type: item.type,
      Status: item.status,
      Progress: item.progress,
      TotalProgress: item.totalProgress || 0,
      Score: item.score || 0,
      Image: item.image || ''
    }));
    return Papa.unparse(csvData);
  },

  // Import JSON with Zod Validation
  importFromJSON(jsonString: string): ImportResult {
    try {
      const rawData = JSON.parse(jsonString);
      
      if (!Array.isArray(rawData)) {
        return { success: false, data: [], errors: [{ row: 0, field: 'root', message: 'O arquivo JSON deve conter um array de itens.' }] };
      }

      const validData: UserMedia[] = [];
      const errors: Array<{ row: number; field: string; message: string }> = [];

      rawData.forEach((item, index) => {
        const parsed = UserMediaSchema.safeParse(item);
        if (parsed.success) {
          validData.push(parsed.data as UserMedia);
        } else {
          parsed.error.issues.forEach(err => {
            errors.push({
              row: index + 1,
              field: err.path.join('.'),
              message: err.message
            });
          });
        }
      });

      return {
        success: errors.length === 0,
        data: validData,
        errors
      };

    } catch (e: any) {
      return { success: false, data: [], errors: [{ row: 0, field: 'syntax', message: 'Formato JSON inválido.' }] };
    }
  },

  // Import CSV with Papaparse and Zod
  importFromCSV(csvString: string): ImportResult {
    const parsed = Papa.parse(csvString, { header: true, skipEmptyLines: true });
    
    if (parsed.errors && parsed.errors.length > 0) {
      return {
        success: false,
        data: [],
        errors: parsed.errors.map(e => ({ row: e.row || 0, field: 'csv', message: e.message }))
      };
    }

    const validData: UserMedia[] = [];
    const errors: Array<{ row: number; field: string; message: string }> = [];

    parsed.data.forEach((row: any, index: number) => {
      // Map CSV to our schema format
      const rawItem = {
        id: parseInt(row.ID || row.id, 10),
        title: row.Title || row.title,
        type: row.Type || row.type || 'ANIME',
        status: row.Status || row.status,
        progress: parseInt(row.Progress || row.progress || '0', 10),
        totalProgress: parseInt(row.TotalProgress || row.totalProgress || '0', 10),
        score: parseFloat(row.Score || row.score || '0'),
        image: row.Image || row.image || ''
      };

      const parsedRow = UserMediaSchema.safeParse(rawItem);
      if (parsedRow.success) {
        validData.push(parsedRow.data as UserMedia);
      } else {
        parsedRow.error.issues.forEach(err => {
          errors.push({
            row: index + 1,
            field: err.path.join('.'),
            message: err.message
          });
        });
      }
    });

    return {
      success: errors.length === 0,
      data: validData,
      errors
    };
  }
};
