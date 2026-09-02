import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Id from '@salesforce/user/Id';

export default class NextjsPortalHost extends LightningElement {
    @api nextjsBaseUrl = 'https://sf-nextjs-integration.vercel.app';
    @api defaultRoute = '/applications';
    
    currentUserId = Id;
    messageHandler = null;

    get iframeUrl() {
        if (!this.nextjsBaseUrl) return '';
        const base = this.nextjsBaseUrl.replace(/\/$/, '');
        const route = this.defaultRoute.startsWith('/') ? this.defaultRoute : `/${this.defaultRoute}`;
        const origin = window.location.origin;
        return `${base}${route}?sfUserId=${encodeURIComponent(this.currentUserId || '')}&origin=${encodeURIComponent(origin)}`;
    }

    get trustedOrigin() {
        if (!this.nextjsBaseUrl) return '';
        try {
            return new URL(this.nextjsBaseUrl).origin;
        } catch (e) {
            return '';
        }
    }

    connectedCallback() {
        this.messageHandler = this.handleWindowMessage.bind(this);
        window.addEventListener('message', this.messageHandler);
    }

    disconnectedCallback() {
        if (this.messageHandler) {
            window.removeEventListener('message', this.messageHandler);
        }
    }

    handleWindowMessage(event) {
        // 1. Strict Origin Validation
        if (!this.trustedOrigin || event.origin !== this.trustedOrigin) {
            return;
        }

        // 2. Strict Source Validation
        const data = event.data;
        if (!data || data.source !== 'NEXTJS_APP') {
            return;
        }

        // 3. Handle Supported Message Types
        switch (data.type) {
            case 'SHOW_TOAST':
                this.handleShowToast(data.payload);
                break;
            case 'RESIZE_HEIGHT':
                this.handleResizeHeight(data.payload);
                break;
            case 'NAVIGATION_CHANGE':
                this.handleNavigationChange(data.payload);
                break;
            default:
                console.warn('Unhandled message type from Next.js portal:', data.type);
        }
    }

    handleShowToast(payload) {
        if (!payload) return;
        const toastEvent = new ShowToastEvent({
            title: payload.title || 'Partner Portal Notification',
            message: payload.message || '',
            variant: payload.variant || 'info',
            mode: payload.variant === 'error' ? 'sticky' : 'dismissable'
        });
        this.dispatchEvent(toastEvent);
    }

    handleResizeHeight(payload) {
        if (!payload || !payload.height) return;
        const iframe = this.template.querySelector('.nextjs-iframe');
        if (iframe) {
            const newHeight = Math.max(payload.height, 400);
            iframe.style.height = `${newHeight}px`;
        }
    }

    handleNavigationChange(payload) {
        if (!payload || !payload.path) return;
        console.log('Next.js Navigation Change:', payload.path);
    }
}
