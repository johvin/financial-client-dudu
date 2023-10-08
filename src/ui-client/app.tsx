import ReactDOM from 'react-dom/client';
import { AppLayout } from './layout';

export const renderUIApp = (root: HTMLElement) => {
  ReactDOM.createRoot(root).render(<AppLayout />);
};
