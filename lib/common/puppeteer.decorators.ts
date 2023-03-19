import { Inject } from '@nestjs/common';
import { getBrowserToken, getPageToken } from './puppeteer.utils';

export const InjectBrowser = (
  browserName?: string,
): ReturnType<typeof Inject> => Inject(getBrowserToken(browserName));

export const InjectPage = (
  pageName: string,
  browserName?: string,
): ReturnType<typeof Inject> => Inject(getPageToken(pageName, browserName));
