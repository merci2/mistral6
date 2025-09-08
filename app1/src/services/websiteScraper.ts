import axios from 'axios';
import * as cheerio from 'cheerio';

export class WebsiteScraperService {
  async scrapeWebsite(url: string): Promise<{
    title: string;
    content: string;
    url: string;
  }[]> {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      // Extract main content
      const title = $('title').text();
      const content = this.extractTextContent($);
      
      return [{
        title,
        content: this.cleanText(content),
        url
      }];
    } catch (error) {
      console.error('Scraping error:', error);
      return [];
    }
  }

  private extractTextContent($: cheerio.CheerioAPI): string {
    // Remove unwanted elements
    $('script, style, nav, footer, aside').remove();
    
    // Extract text from main content areas
    const contentSelectors = [
      'main', 'article', '.content', '#content',
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ];
    
    let content = '';
    contentSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        content += $(element).text() + '\n';
      });
    });
    
    return content;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }
}

// Export a default instance for convenience
export const websiteScraperService = new WebsiteScraperService();