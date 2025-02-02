/** *******************************************************************
 * copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import 'reflect-metadata';
import { e2eContainer } from '../../configs/inversify.config';
import {
	ActivityBar,
	ContextMenu,
	EditorView,
	InputBox,
	Locators,
	ModalDialog,
	NewScmView,
	SingleScmProvider,
	TextEditor,
	ViewControl,
	ViewSection
} from 'monaco-page-objects';
import { expect } from 'chai';
import { StringUtil } from '../../utils/StringUtil';
import { CheCodeLocatorLoader } from '../../pageobjects/ide/CheCodeLocatorLoader';
import { registerRunningWorkspace } from '../MochaHooks';
import { BrowserTabsUtil } from '../../utils/BrowserTabsUtil';
import { CLASSES } from '../../configs/inversify.types';
import { WorkspaceHandlingTests } from '../../tests-library/WorkspaceHandlingTests';
import { ProjectAndFileTests } from '../../tests-library/ProjectAndFileTests';
import { DriverHelper } from '../../utils/DriverHelper';
import { Dashboard } from '../../pageobjects/dashboard/Dashboard';
import { Workspaces } from '../../pageobjects/dashboard/Workspaces';
import { Logger } from '../../utils/Logger';
import { LoginTests } from '../../tests-library/LoginTests';
import { FACTORY_TEST_CONSTANTS, GitProviderType } from '../../constants/FACTORY_TEST_CONSTANTS';
import { OAUTH_CONSTANTS } from '../../constants/OAUTH_CONSTANTS';
import { BASE_TEST_CONSTANTS } from '../../constants/BASE_TEST_CONSTANTS';

suite(
	`Create a workspace via launching a factory from the ${FACTORY_TEST_CONSTANTS.TS_SELENIUM_FACTORY_GIT_PROVIDER} repository without OAuth setup`,
	function (): void {
		const browserTabsUtil: BrowserTabsUtil = e2eContainer.get(CLASSES.BrowserTabsUtil);
		const workspaceHandlingTests: WorkspaceHandlingTests = e2eContainer.get(CLASSES.WorkspaceHandlingTests);
		const projectAndFileTests: ProjectAndFileTests = e2eContainer.get(CLASSES.ProjectAndFileTests);
		const webCheCodeLocators: Locators = new CheCodeLocatorLoader().webCheCodeLocators;
		const driverHelper: DriverHelper = e2eContainer.get(CLASSES.DriverHelper);
		const dashboard: Dashboard = e2eContainer.get(CLASSES.Dashboard);
		const workspaces: Workspaces = e2eContainer.get(CLASSES.Workspaces);
		const loginTests: LoginTests = e2eContainer.get(CLASSES.LoginTests);

		let projectSection: ViewSection;
		let scmProvider: SingleScmProvider;
		let scmContextMenu: ContextMenu;

		// test specific data
		let numberOfCreatedWorkspaces: number = 0;
		const timeToRefresh: number = 1500;
		const changesToCommit: string = new Date().getTime().toString();
		const fileToChange: string = 'Date.txt';
		const pushItemLabel: string = 'Push';
		const commitChangesButtonLabel: string = `Commit Changes on "${FACTORY_TEST_CONSTANTS.TS_SELENIUM_FACTORY_GIT_REPO_BRANCH}"`;
		const refreshButtonLabel: string = 'Refresh';
		const label: string = BASE_TEST_CONSTANTS.TS_SELENIUM_PROJECT_ROOT_FILE_NAME;
		let testRepoProjectName: string;
		const isPrivateRepo: string = FACTORY_TEST_CONSTANTS.TS_SELENIUM_IS_PRIVATE_FACTORY_GIT_REPO ? 'private' : 'public';

		loginTests.loginIntoChe();

		test('Get number of previously created workspaces', async function (): Promise<void> {
			await dashboard.clickWorkspacesButton();
			await workspaces.waitPage();
			numberOfCreatedWorkspaces = (await workspaces.getAllCreatedWorkspacesNames()).length;
		});

		test(`Navigate to the ${isPrivateRepo} repository factory URL`, async function (): Promise<void> {
			await browserTabsUtil.navigateTo(FACTORY_TEST_CONSTANTS.TS_SELENIUM_FACTORY_URL());
		});

		if (FACTORY_TEST_CONSTANTS.TS_SELENIUM_IS_PRIVATE_FACTORY_GIT_REPO) {
			test(`Check that workspace cannot be created without OAuth for ${isPrivateRepo} repo`, async function (): Promise<void> {
				await dashboard.waitLoader();
				const loaderAlert: string = await dashboard.getLoaderAlert();
				expect(loaderAlert).to.contain('Cause: Could not reach devfile at');
			});

			test('Check that workspace was not created', async function (): Promise<void> {
				await dashboard.openDashboard();
				await dashboard.clickWorkspacesButton();
				await workspaces.waitPage();
				const allCreatedWorkspacesNames: string[] = await workspaces.getAllCreatedWorkspacesNames();
				expect(allCreatedWorkspacesNames).has.length(numberOfCreatedWorkspaces);
			});

			loginTests.logoutFromChe();
		} else {
			test('Obtain workspace name from workspace loader page', async function (): Promise<void> {
				await workspaceHandlingTests.obtainWorkspaceNameFromStartingPage();
			});

			test('Registering the running workspace', function (): void {
				registerRunningWorkspace(WorkspaceHandlingTests.getWorkspaceName());
			});

			test('Wait the workspace readiness', async function (): Promise<void> {
				await projectAndFileTests.waitWorkspaceReadinessForCheCodeEditor();
			});

			test('Check if a project folder has been created', async function (): Promise<void> {
				testRepoProjectName = StringUtil.getProjectNameFromGitUrl(FACTORY_TEST_CONSTANTS.TS_SELENIUM_FACTORY_GIT_REPO_URL);
				projectSection = await projectAndFileTests.getProjectViewSession();
				expect(await projectAndFileTests.getProjectTreeItem(projectSection, testRepoProjectName), 'Project folder was not imported')
					.not.undefined;
			});

			test('Accept the project as a trusted one', async function (): Promise<void> {
				await projectAndFileTests.performTrustAuthorDialog();
			});

			test('Check if the project files were imported', async function (): Promise<void> {
				expect(await projectAndFileTests.getProjectTreeItem(projectSection, label), 'Project files were not imported').not
					.undefined;
			});

			test('Make changes to the file', async function (): Promise<void> {
				Logger.debug(`projectSection.openItem: "${fileToChange}"`);
				await projectSection.openItem(fileToChange);
				const editor: TextEditor = (await new EditorView().openEditor(fileToChange)) as TextEditor;
				await driverHelper.waitVisibility(webCheCodeLocators.Editor.inputArea);
				Logger.debug('editor.clearText');
				await editor.clearText();
				Logger.debug(`editor.typeTextAt: "${changesToCommit}"`);
				await editor.typeTextAt(1, 1, changesToCommit);
			});

			test('Open a source control manager', async function (): Promise<void> {
				const viewSourceControl: string = 'Source Control';
				const sourceControl: ViewControl = (await new ActivityBar().getViewControl(viewSourceControl)) as ViewControl;
				Logger.debug(`sourceControl.openView: "${viewSourceControl}"`);
				await sourceControl.openView();
				const scmView: NewScmView = new NewScmView();
				await driverHelper.waitVisibility(webCheCodeLocators.ScmView.inputField);
				let rest: SingleScmProvider[];
				[scmProvider, ...rest] = await scmView.getProviders();
				Logger.debug(`scmView.getProviders: "${JSON.stringify(scmProvider)}, ${rest}"`);
			});

			test('Check if the changes are displayed in the source control manager', async function (): Promise<void> {
				await driverHelper.waitVisibility(webCheCodeLocators.ScmView.more);
				await driverHelper.wait(timeToRefresh);
				Logger.debug(`scmProvider.takeAction: "${refreshButtonLabel}"`);
				await scmProvider.takeAction(refreshButtonLabel);
				// wait while changes counter will be refreshed
				await driverHelper.wait(timeToRefresh);
				const changes: number = await scmProvider.getChangeCount();
				Logger.debug(`scmProvider.getChangeCount: number of changes is "${changes}"`);
				expect(changes).eql(1);
			});

			test('Stage the changes', async function (): Promise<void> {
				await driverHelper.waitVisibility(webCheCodeLocators.ScmView.more);
				Logger.debug('scmProvider.openMoreActions');
				scmContextMenu = await scmProvider.openMoreActions();
				await driverHelper.waitVisibility(webCheCodeLocators.ContextMenu.contextView);
				Logger.debug('scmContextMenu.select: "Changes" -> "Stage All Changes"');
				await scmContextMenu.select('Changes', 'Stage All Changes');
			});

			test('Commit the changes', async function (): Promise<void> {
				Logger.debug(`scmProvider.commitChanges: commit name "Commit ${changesToCommit}"`);
				await scmProvider.commitChanges('Commit ' + changesToCommit);
				await driverHelper.waitVisibility(webCheCodeLocators.ScmView.more);
				await driverHelper.wait(timeToRefresh);
				Logger.debug(`scmProvider.takeAction: "${refreshButtonLabel}"`);
				await scmProvider.takeAction(refreshButtonLabel);
				// wait while changes counter will be refreshed
				await driverHelper.wait(timeToRefresh);
				const changes: number = await scmProvider.getChangeCount();
				Logger.debug(`scmProvider.getChangeCount: number of changes is "${changes}"`);
				expect(changes).eql(0);
			});

			test('Push the changes', async function (): Promise<void> {
				await driverHelper.waitVisibility(
					webCheCodeLocators.ScmView.actionConstructor(
						`Push 1 commits to origin/${FACTORY_TEST_CONSTANTS.TS_SELENIUM_FACTORY_GIT_REPO_BRANCH}`
					)
				);
				await driverHelper.waitVisibility(webCheCodeLocators.ScmView.more);
				Logger.debug('scmProvider.openMoreActions');
				scmContextMenu = await scmProvider.openMoreActions();
				await driverHelper.waitVisibility(webCheCodeLocators.ContextMenu.itemConstructor(pushItemLabel));
				Logger.debug(`scmContextMenu.select: "${pushItemLabel}"`);
				await scmContextMenu.select(pushItemLabel);
			});

			if (FACTORY_TEST_CONSTANTS.TS_SELENIUM_FACTORY_GIT_PROVIDER === GitProviderType.GITHUB) {
				test('Decline GitHub Extension', async function (): Promise<void> {
					await driverHelper.waitVisibility(webCheCodeLocators.Dialog.details);
					const gitHaExtensionDialog: ModalDialog = new ModalDialog();
					await gitHaExtensionDialog.pushButton('Cancel');
				});
			}

			test('Insert git credentials which were asked after push', async function (): Promise<void> {
				try {
					await driverHelper.waitVisibility(webCheCodeLocators.InputBox.message);
				} catch (e) {
					Logger.info(`Workspace did not ask credentials before push - ${e};
                Known issue for github.com - https://issues.redhat.com/browse/CRW-4066, please check if not other git provider. `);
					expect(FACTORY_TEST_CONSTANTS.TS_SELENIUM_FACTORY_GIT_PROVIDER).eqls(GitProviderType.GITHUB);
				}
				const input: InputBox = new InputBox();
				await input.setText(OAUTH_CONSTANTS.TS_SELENIUM_GIT_PROVIDER_USERNAME);
				await input.confirm();
				await driverHelper.wait(timeToRefresh);
				await input.setText(OAUTH_CONSTANTS.TS_SELENIUM_GIT_PROVIDER_PASSWORD);
				await input.confirm();
				await driverHelper.wait(timeToRefresh);
			});

			test('Check if the changes were pushed', async function (): Promise<void> {
				try {
					Logger.debug(`scmProvider.takeAction: "${refreshButtonLabel}"`);
					await scmProvider.takeAction(refreshButtonLabel);
				} catch (e) {
					Logger.info(
						'Check you use correct credentials.' +
							'For bitbucket.org ensure you use an app password: https://support.atlassian.com/bitbucket-cloud/docs/using-app-passwords/;' +
							'For github.com - personal access token instead of password.'
					);
				}
				const isCommitButtonDisabled: string = await driverHelper.waitAndGetElementAttribute(
					webCheCodeLocators.ScmView.actionConstructor(commitChangesButtonLabel),
					'aria-disabled'
				);
				expect(isCommitButtonDisabled).to.be.true;
			});

			test('Stop the workspace', async function (): Promise<void> {
				await workspaceHandlingTests.stopWorkspace(WorkspaceHandlingTests.getWorkspaceName());
				await browserTabsUtil.closeAllTabsExceptCurrent();
			});

			test('Delete the workspace', async function (): Promise<void> {
				await workspaceHandlingTests.removeWorkspace(WorkspaceHandlingTests.getWorkspaceName());
			});

			loginTests.logoutFromChe();
		}
	}
);
