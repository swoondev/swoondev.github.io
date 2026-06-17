import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { staticcontent } from './global/globals';
import { Api } from './api';

@Component({
  selector: 'search-by-lake',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-by-lake.html',
  styleUrls: ['./search-by-lake.css']
})
export class SearchByLake {
  lakeName = '';
  countyInput = 0;
  counties: { County: string; Id: number }[] = staticcontent.counties;
  searchstatus = '';
  searchResult: any = null;
  hasSearched = false;

  constructor(private apiService: Api, private cdr: ChangeDetectorRef) {}

  private setStatus(message: string) {
    this.searchstatus = message;
    this.cdr.detectChanges();
  }

    private GetLengthCount(survey: any, species: string, min: number, max: number) {
    let count = 0;
    if (survey.lengths[species] != undefined) {
      for (let i = 0; i < survey.lengths[species].fishCount.length; i++) {
        if (survey.lengths[species].fishCount[i][0] >= min && survey.lengths[species].fishCount[i][0] <= max) {
          count += survey.lengths[species].fishCount[i][1];
        }
      }
    }
    return count;
  }


  

    private revealfishlengthstats(survey: any) {
    const fishlen: any[] = [];
    fishlen.push(this.GetLengthCount(survey, survey.species, 0, 5));
    fishlen.push(this.GetLengthCount(survey, survey.species, 6, 7));
    fishlen.push(this.GetLengthCount(survey, survey.species, 8, 9));
    fishlen.push(this.GetLengthCount(survey, survey.species, 10, 11));
    fishlen.push(this.GetLengthCount(survey, survey.species, 12, 14));
    fishlen.push(this.GetLengthCount(survey, survey.species, 15, 19));
    fishlen.push(this.GetLengthCount(survey, survey.species, 20, 24));
    fishlen.push(this.GetLengthCount(survey, survey.species, 25, 29));
    fishlen.push(this.GetLengthCount(survey, survey.species, 30, 34));
    fishlen.push(this.GetLengthCount(survey, survey.species, 35, 39));
    fishlen.push(this.GetLengthCount(survey, survey.species, 40, 44));
    fishlen.push(this.GetLengthCount(survey, survey.species, 45, 49));
    fishlen.push(this.GetLengthCount(survey, survey.species, 50, 100));
    fishlen.push(this.GetLengthCount(survey, survey.species, 0, 100));
    return fishlen;
  }

  public async getLakeByName(name: string, county: number) {
    this.hasSearched = true;
    this.searchResult = null;

    const query = name?.trim();
    if (!query) {
      this.setStatus('Please enter a lake name.');
      return;
    }

    this.setStatus(`Searching for lake named "${query}"...`);
    try {
      const result = await this.apiService.GetLakeByName(query, county);
      if (!result?.results?.length) {
        this.setStatus(`No lake found with the name "${query}".`);
        return;
      }

      this.searchResult = result.results[0];
      this.setStatus(`Found lake: ${this.searchResult.name} (ID: ${this.searchResult.id}).`);
    } catch (err) {
      console.error(err);
      this.setStatus('Error searching for lake by name.');
    }
  }
}
