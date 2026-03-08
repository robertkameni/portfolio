import { Component, inject, OnInit } from '@angular/core';
import { PortfolioStore } from '../store/portfolio.store';
import { SkillsBentoComponent } from './components/skills-bento/skills-bento';
import { HeroComponent } from "./components/hero/hero";
import { ContactComponent } from "./components/contact/contact";
import {About} from "./components/about/about";
import {IntroComponent} from "./components/intro/intro";

@Component({
  selector: 'app-home',
  imports: [SkillsBentoComponent, HeroComponent, ContactComponent, About, IntroComponent],
  templateUrl: './index.page.html',
})
export default class Home implements OnInit {
  store = inject(PortfolioStore);

  ngOnInit() {
    this.store.loadProfile();
  }
}
