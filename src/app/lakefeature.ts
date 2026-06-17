import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lake-feature',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lakefeature.html',
  styleUrls: ['./lakefeature.css']
})
export class LakeFeature {
}
