/** *******************************************************************
 * copyright (c) 2020-2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/
import { BASE_TEST_CONSTANTS } from './BASE_TEST_CONSTANTS';

export enum GitProviderType {
	GITHUB = 'github',
	GITLAB = 'gitlab',
	BITBUCKET = 'bitbucket',
	AZURE_DEVOPS = 'azure-devops'
}

export const FACTORY_TEST_CONSTANTS: {
	TS_SELENIUM_FACTORY_GIT_REPO_URL: string;
	TS_SELENIUM_PROJECT_NAME: string;
	TS_SELENIUM_IS_PRIVATE_FACTORY_GIT_REPO: boolean;
	TS_SELENIUM_FACTORY_GIT_PROVIDER: string;
	TS_SELENIUM_FACTORY_GIT_REPO_BRANCH: string;
	TS_SELENIUM_FACTORY_URL(): string;
} = {
	/**
	 * git provider to check in factory tests
	 */
	TS_SELENIUM_FACTORY_GIT_PROVIDER: process.env.TS_SELENIUM_FACTORY_GIT_PROVIDER || GitProviderType.GITHUB,

	/**
	 * url to create factory
	 */
	TS_SELENIUM_FACTORY_GIT_REPO_URL: process.env.TS_SELENIUM_FACTORY_GIT_REPO_URL || '',

	/**
	 * git repository name
	 */
	TS_SELENIUM_PROJECT_NAME: process.env.TS_SELENIUM_PROJECT_NAME || '',

	/**
	 * is factory repository URL private or no
	 */
	TS_SELENIUM_IS_PRIVATE_FACTORY_GIT_REPO: process.env.TS_SELENIUM_IS_PRIVATE_FACTORY_GIT_REPO === 'true',

	/**
	 * git repository main branch name (main or master)
	 */
	TS_SELENIUM_FACTORY_GIT_REPO_BRANCH: process.env.TS_SELENIUM_FACTORY_GIT_REPO_BRANCH || 'master',

	/**
	 * full factory URL
	 */
	TS_SELENIUM_FACTORY_URL(): string {
		return (
			process.env.TS_SELENIUM_FACTORY_URL ||
			BASE_TEST_CONSTANTS.TS_SELENIUM_BASE_URL + '/dashboard/#/' + this.TS_SELENIUM_FACTORY_GIT_REPO_URL
		);
	}
};
