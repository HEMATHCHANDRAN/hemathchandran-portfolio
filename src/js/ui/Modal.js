export class Modal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.content = document.getElementById('info-content');
        this.isVisible = false;
        
        // Close button
        document.getElementById('close-info').addEventListener('click', () => {
            this.hide();
        });
        
        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    show(content) {
        this.content.innerHTML = content;
        this.modal.classList.add('active');
        this.isVisible = true;
    }

    hide() {
        this.modal.classList.remove('active');
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    updateContent(content) {
        this.content.innerHTML = content;
    }
}