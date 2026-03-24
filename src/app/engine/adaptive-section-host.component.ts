import { Component, Input, OnInit, ViewContainerRef, ViewChild, inject, ComponentRef, effect } from '@angular/core';
import { ExperienceStore } from '../store/experience.store';
import { componentMap } from './component.map';

@Component({
  selector: 'app-adaptive-section-host',
  standalone: true,
  template: `<ng-container #dynamicContainer></ng-container>`,
})
export class AdaptiveSectionHostComponent implements OnInit {
  @Input({ required: true }) sectionId!: string;
  @Input({ required: true }) defaultComponentKey!: string;
  // Use inputs to pass down any data the dynamically loaded component might need
  @Input() data: any;

  @ViewChild('dynamicContainer', { read: ViewContainerRef, static: true })
  private container!: ViewContainerRef;

  private readonly experienceStore = inject(ExperienceStore);
  private currentComponentRef: ComponentRef<any> | null = null;

  constructor() {
    // Setup an effect to watch the directives signal
    effect(() => {
      // Accessing the signal registers the dependency
      const directives = this.experienceStore.directives();
      const activeDirective = directives[this.sectionId];

      // Determine which component key to load
      const targetComponentKey = activeDirective?.component || this.defaultComponentKey;

      // Load and render it
      this.loadComponent(targetComponentKey);
    });
  }

  ngOnInit() {
    // The initial load is handled by the effect, but we can ensure a default state here if needed
  }

  private async loadComponent(componentKey: string) {
    const componentLoader = componentMap[componentKey];

    if (!componentLoader) {
      console.error(`[AdaptiveSectionHost] No component registered for key: ${componentKey}`);
      return;
    }

    try {
      const componentClass = await componentLoader();

      // Clear the container before loading the new component
      this.container.clear();

      // Create and insert the component
      this.currentComponentRef = this.container.createComponent(componentClass);

      // Pass the data down if the component accepts it
      if (this.data) {
          // Note: In newer Angular versions with signal inputs, setting properties
          // on the component instance directly might require setInput() if it's an InputSignal.
          // For traditional @Input(), direct assignment works.
          // Assuming the target component has inputs that match the data object structure.
          Object.assign(this.currentComponentRef.instance, this.data);
      }

    } catch (error) {
       console.error(`[AdaptiveSectionHost] Failed to load component: ${componentKey}`, error);
    }
  }
}
