import { Component } from "@angular/core";

@Component({
    selector: 'dev-footer',
    standalone: true,
    imports: [],
    templateUrl: './page/footer.html',
})
export class FooterComponent {
    year = new Date().getFullYear();
}