import * as templateService from './templateService';
import { TemplateCategory, TemplateIndustry, TemplateFormat } from './templateService';
import { industries, categories, formats, templates, templateCounts } from '../data/templateData';
import api from './api';

// Extended interfaces for seeding data
interface ExtendedTemplateCategory extends Partial<TemplateCategory> {
  icon?: string;
}

interface ExtendedTemplateIndustry extends Partial<TemplateIndustry> {
  icon?: string;
}

interface ExtendedTemplateFormat extends Partial<TemplateFormat> {
  platform?: string;
  specs?: Record<string, any>;
}

/**
 * Service for seeding and initializing the templates library with predefined templates
 */

/**
 * Seed template categories into the database
 */
export const seedCategories = async () => {
  console.log(`Seeding ${categories.length} template categories...`);
  
  for (const category of categories) {
    try {
      const categoryData: ExtendedTemplateCategory = {
        name: category.name,
        description: category.description,
        icon: category.icon
      };
      await templateService.createTemplateCategory(categoryData);
      console.log(`Created category: ${category.name}`);
    } catch (error) {
      console.error(`Error creating category ${category.name}:`, error);
    }
  }
  
  console.log('Template categories seeding complete.');
};

/**
 * Seed template industries into the database
 */
export const seedIndustries = async () => {
  console.log(`Seeding ${industries.length} template industries...`);
  
  for (const industry of industries) {
    try {
      const industryData: ExtendedTemplateIndustry = {
        name: industry.name,
        description: industry.description,
        icon: industry.icon
      };
      await templateService.createTemplateIndustry(industryData);
      console.log(`Created industry: ${industry.name}`);
    } catch (error) {
      console.error(`Error creating industry ${industry.name}:`, error);
    }
  }
  
  console.log('Template industries seeding complete.');
};

/**
 * Seed template formats into the database
 */
export const seedFormats = async () => {
  console.log(`Seeding ${formats.length} template formats...`);
  
  for (const format of formats) {
    try {
      const formatData: ExtendedTemplateFormat = {
        name: format.name,
        description: format.description,
        platform: format.platform,
        content_type: format.content_type,
        specs: format.specs
      };
      await templateService.createTemplateFormat(formatData);
      console.log(`Created format: ${format.name}`);
    } catch (error) {
      console.error(`Error creating format ${format.name}:`, error);
    }
  }
  
  console.log('Template formats seeding complete.');
};

/**
 * Seed templates into the database
 */
export const seedTemplates = async () => {
  console.log(`Seeding ${templates.length} templates...`);
  
  for (const template of templates) {
    try {
      await templateService.createTemplate({
        title: template.title,
        description: template.description,
        content: template.content,
        format_id: template.format_id,
        preview_image: template.preview_image || undefined,
        dynamic_fields: template.dynamic_fields,
        tone_options: template.tone_options,
        is_featured: template.is_featured,
        is_premium: template.is_premium,
        category_ids: template.categories,
        industry_ids: template.industries
      });
      console.log(`Created template: ${template.title}`);
    } catch (error) {
      console.error(`Error creating template ${template.title}:`, error);
    }
  }
  
  console.log('Templates seeding complete.');
};

/**
 * Seed the entire templates library
 */
export const seedTemplateLibrary = async () => {
  console.log('Starting templates library seeding process...');
  
  // Seed in the correct order to handle dependencies
  await seedCategories();
  await seedIndustries();
  await seedFormats();
  await seedTemplates();
  
  console.log('Templates library seeding complete!');
  console.log(`Total categories: ${categories.length}`);
  console.log(`Total industries: ${industries.length}`);
  console.log(`Total formats: ${formats.length}`);
  console.log(`Total templates: ${templates.length}`);
  console.log('Template counts by industry:');
  
  for (const [industry, count] of Object.entries(templateCounts)) {
    console.log(`- ${industry}: ${count} templates`);
  }
  
  return {
    success: true,
    counts: {
      categories: categories.length,
      industries: industries.length,
      formats: formats.length,
      templates: templates.length,
      byIndustry: templateCounts
    }
  };
};

/**
 * Check if any templates exist in the database
 * @returns Promise<boolean> True if templates exist, false otherwise
 */
export const templatesExist = async (): Promise<boolean> => {
  try {
    // Use the check endpoint from the seed templates API
    const response = await api.get('/api/v1/seed-templates/check');
    return response.data.exists;
  } catch (error) {
    console.error('Error checking if templates exist:', error);
    return false;
  }
};

/**
 * Seed templates if none exist yet
 */
export const seedTemplatesIfNeeded = async (): Promise<void> => {
  try {
    const hasTemplates = await templatesExist();
    
    if (!hasTemplates) {
      console.log('No templates found in database. Starting seeding process...');
      try {
        // Call the seed templates API endpoint
        await api.post('/api/v1/seed-templates');
        console.log('Template seeding initiated on server.');
      } catch (error) {
        console.error('Error calling seed templates API:', error);
        // Fall back to client-side seeding if API fails
        console.log('Falling back to client-side seeding...');
        await seedTemplateLibrary();
      }
    } else {
      console.log('Templates already exist in database. Skipping seeding process.');
    }
  } catch (error) {
    console.error('Error in seedTemplatesIfNeeded:', error);
  }
};

/**
 * Get template counts and statistics
 */
export const getTemplateStats = async () => {
  try {
    // Get categories with template counts
    const categories = await templateService.getTemplateCategories();
    
    // Get industries with template counts
    const industries = await templateService.getTemplateIndustries();
    
    // Get formats with template counts
    const formats = await templateService.getTemplateFormats();
    
    // Get template statistics
    const featuredTemplates = await templateService.getTemplates({ is_featured: true });
    const allTemplates = await templateService.getTemplates();
    const popularTemplates = await templateService.getPopularTemplates(10);
    
    return {
      categories,
      industries,
      formats,
      featuredTemplates,
      popularTemplates,
      totalTemplates: allTemplates.length,
      featuredCount: featuredTemplates.length,
      premiumCount: allTemplates.filter(t => t.is_premium).length
    };
  } catch (error) {
    console.error('Error getting template statistics:', error);
    throw error;
  }
};
