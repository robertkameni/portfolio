import { Component } from "@angular/core";

@Component({
    selector: 'dev-footer',
    standalone: true,
    imports: [],
    template: `
    <footer class="flex items-center text-center justify-center h-25 py-8 bg-[#04110a]">
        <p class="text-sm text-[#94a3b8]">© RK - Consulting {{year}}</p>
    </footer>
    `
})
export class FooterComponent {
    year = new Date().getFullYear();
}