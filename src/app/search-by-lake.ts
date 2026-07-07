import { ChangeDetectorRef, Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  speciesInput = '';
  counties: { County: string; Id: number }[] = staticcontent.counties;
  species: { Species: string; Id: string }[] = staticcontent.Species;
  searchstatus = '';
  searchResult: any = null;
  hasSearched = false;
  isSearching = false;
  lakeTableData: any[] = [];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  dialogVisible = false;
  dialogContent = '';
  safeDialogContent: SafeHtml = '';

  constructor(private apiService: Api, private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) {}

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


  

    private revealfishlengthstats(survey: any, species: string) {
    const fishlen: any[] = [];
    const speciesKey = species || survey.species;
    fishlen.push(this.GetLengthCount(survey, speciesKey, 0, 5));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 6, 7));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 8, 9));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 10, 11));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 12, 14));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 15, 19));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 20, 24));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 25, 29));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 30, 34));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 35, 39));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 40, 44));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 45, 49));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 50, 100));
    fishlen.push(this.GetLengthCount(survey, speciesKey, 0, 100));
    return fishlen;
  }

  public async getLakeByName(name: string, county: number) {
    this.hasSearched = true;
    this.isSearching = true;
    this.searchResult = null;
    this.lakeTableData = [];

    const query = name?.trim();
    if (!query) {
      this.setStatus('Please enter a lake name.');
      return;
    }

    if (!this.speciesInput) {
      this.setStatus('Please select a species.');
      return;
    }

    this.setStatus(`Searching for lake named "${query}"...`);
    try {
      const result = await this.apiService.GetLakeByName(query, county);
      if (!result?.results?.length) {
        this.setStatus(`No lake found with the name "${query}".`);
        return;
      }

      this.setStatus(`Found ${result.results.length} matching lake(s). Retrieving survey data...`);

      // Process all matching lakes
      for (let lakeIndex = 0; lakeIndex < result.results.length; lakeIndex++) {
        const lake = result.results[lakeIndex];
        try {
          const survey = await this.apiService.GetLakeData(lake.id);

          if (!survey || survey.status !== 'SUCCESS' || survey.message !== 'Normal execution.') {
            continue;
          }

          const surveyData = Array.isArray(survey.result?.surveys) ? survey.result.surveys : [];
          if (!surveyData.length) {
            continue;
          }

          const normalizedSurveyData = surveyData.map((data: any) => ({ ...data, surveyDate: new Date(data.surveyDate) }));
          normalizedSurveyData.sort((a: any, b: any) => a.surveyDate - b.surveyDate);
          const standardSurveys = normalizedSurveyData.filter((x: any) => x.surveyType == 'Standard Survey');

          const latestSurvey = standardSurveys[standardSurveys.length - 1];
          if (!latestSurvey) {
            continue;
          }

          const speciesToAnalyze = this.speciesInput;
          const fishlenarray = this.revealfishlengthstats(latestSurvey, speciesToAnalyze);
          const speciesdata = (latestSurvey.fishCatchSummaries ?? []).filter((fish: any) => fish.species == speciesToAnalyze);

          if (fishlenarray[13] > 0) {
            this.lakeTableData.push({
              name: lake.name,
              county: lake.county,
              lakeSize: survey.result?.areaAcres ?? lake.area ?? 'N/A',
              speciesdata: speciesdata[speciesdata.length - 1] ?? null,
              fishlengths: {
                zero: fishlenarray[0],
                one: fishlenarray[1],
                two: fishlenarray[2],
                three: fishlenarray[3],
                four: fishlenarray[4],
                five: fishlenarray[5],
                six: fishlenarray[6],
                seven: fishlenarray[7],
                eight: fishlenarray[8],
                nine: fishlenarray[9],
                ten: fishlenarray[10],
                eleven: fishlenarray[11],
                twelve: fishlenarray[12],
                total: fishlenarray[13]
              },
              surveyDate: latestSurvey.surveyDate,
              lakeid: lake.id,
              narrative: latestSurvey.narrative,
              waterAccess: lake.point?.['epsg:4326']
            });
          }
        } catch (innerErr) {
          console.error(`Error processing lake ${lake.name}:`, innerErr);
          continue;
        }
      }

      this.cdr.detectChanges();

      if (this.lakeTableData.length === 0) {
        this.setStatus(`No lakes found with sampled fish for species ${this.speciesInput ? this.species.find((s: any) => s.Id === this.speciesInput)?.Species : 'any'}.`);
      } else {
        this.setStatus(`Found ${this.lakeTableData.length} lake(s) with survey data.`);
      }
      this.isSearching = false;

    } catch (err) {
      console.error(err);
      this.setStatus('Error searching for lakes by name.');
      this.isSearching = false;
    }
  }

  public GoToLake(lakeid: number) {
    window.open('https://www.dnr.state.mn.us/lakefind/lake.html?id=' + lakeid, '_blank');
  }

  public GoToWaterAccess(x: number, y: number) {
    window.open('http://maps.google.com/?saddr=current+location&daddr=' + x + ',' + y, '_blank');
  }

  public openTopo(x: number, y: number) {
    window.open('https://fishing-app.gpsnauticalcharts.com/i-boating-fishing-web-app/fishing-marine-charts-navigation.html#14.7/' + x + '/' + y, '_blank');
  }

  public openDialog(content: string) {
    this.dialogContent = content || 'No summary available.';
    this.safeDialogContent = this.sanitizer.bypassSecurityTrustHtml(this.dialogContent);
    this.dialogVisible = true;
    this.cdr.detectChanges();
  }

  public closeDialog() {
    this.dialogVisible = false;
  }

  public sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    const dir = this.sortDirection === 'asc' ? 1 : -1;

    const getValue = (lake: any) => {
      switch (column) {
        case 'name':
          return (lake.name || '').toString().toLowerCase();
        case 'averageWeight':
          return Number(lake.speciesdata?.averageWeight) || 0;
        case 'surveyDate':
          return new Date(lake.surveyDate).getTime() || 0;
        case 'lakeSize':
          return Number(lake.lakeSize) || 0;
        case 'zero':
        case 'one':
        case 'two':
        case 'three':
        case 'four':
        case 'five':
        case 'six':
        case 'seven':
        case 'eight':
        case 'nine':
        case 'ten':
        case 'eleven':
        case 'twelve':
        case 'total':
          return Number(lake.fishlengths?.[column]) || 0;
        default:
          return 0;
      }
    };

    this.lakeTableData.sort((a: any, b: any) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    this.cdr.detectChanges();
  }
}
