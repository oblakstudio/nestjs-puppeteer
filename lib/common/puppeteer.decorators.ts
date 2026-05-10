import { Inject } from '@nestjs/common';
import { getBrowserToken, getContextToken, getPageToken } from './puppeteer.utils';

export const InjectBrowser = (
  browserName?: string,
): ReturnType<typeof Inject> => Inject(getBrowserToken(browserName));

export const InjectPage = (
  pageName: string,
  browserName?: string,
): ReturnType<typeof Inject> => Inject(getPageToken(pageName, browserName));

export const InjectContext = (
  browserName?: string,
): ReturnType<typeof Inject> => Inject(getContextToken(browserName));
