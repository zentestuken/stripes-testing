import uuid from 'uuid';
import {
  Accordion,
  Button,
  DropdownMenu,
  KeyValue,
  NavListItem,
  Pane,
  Section,
  including,
} from '../../../../../interactors';
import getRandomPostfix from '../../../utils/stringTools';

// TODO: verify on first run - category under which ui-orders stores order email templates
const ORDER_EMAIL_TEMPLATE_CATEGORY = 'Order';

const settingsNavPane = Section({ id: 'settings-nav-pane' });
const listPane = Pane('Order email templates');
const actionsButton = Button('Actions');

export default {
  getDefaultOrderEmailTemplate({ active = true, ...overrides } = {}) {
    return {
      id: uuid(),
      name: `AT_C1621370_${getRandomPostfix()}`,
      description: `AT_C1621370_description_${getRandomPostfix()}`,
      active,
      category: ORDER_EMAIL_TEMPLATE_CATEGORY,
      outputFormats: ['text/html'],
      templateResolver: 'mustache',
      localizedTemplates: {
        en: {
          header: `AT_C1621370_subject_${getRandomPostfix()}`,
          body: '<p>{{organization.name}}</p>{{#orders}}<p>{{poNumber}}</p>{{/orders}}',
        },
      },
      ...overrides,
    };
  },

  createOrderEmailTemplateViaApi(template) {
    return cy
      .okapiRequest({
        method: 'POST',
        path: 'templates',
        body: template,
        isDefaultSearchParamsRequired: false,
      })
      .then(({ body }) => body);
  },

  deleteOrderEmailTemplateViaApi(id) {
    return cy.okapiRequest({
      method: 'DELETE',
      path: `templates/${id}`,
      isDefaultSearchParamsRequired: false,
      failOnStatusCode: false,
    });
  },

  verifyOrdersSettingsNavList(itemLabels) {
    cy.expect(settingsNavPane.exists());
    itemLabels.forEach((label) => {
      cy.expect(settingsNavPane.find(NavListItem(label)).exists());
    });
  },

  waitLoading() {
    cy.expect(listPane.exists());
  },

  verifyListPane(templateNames) {
    cy.expect(listPane.find(Button('New')).exists());
    templateNames.forEach((name) => {
      cy.expect(listPane.find(NavListItem(name)).exists());
    });
  },

  selectTemplate(templateName) {
    cy.do(listPane.find(NavListItem(templateName)).click());
    cy.expect(Pane(templateName).exists());
  },

  verifyGeneralInformation(templateName, { name, active, description }) {
    const detailPane = Pane(templateName);

    cy.expect([
      detailPane.find(actionsButton).exists(),
      detailPane.find(Accordion('General information')).exists(),
      detailPane.find(KeyValue('Template name', { value: name })).exists(),
      detailPane.find(KeyValue('Active', { value: active ? 'Yes' : 'No' })).exists(),
      detailPane.find(KeyValue('Description', { value: description })).exists(),
    ]);
  },

  verifyTemplateContent(templateName, { subject, bodyTokens }) {
    const detailPane = Pane(templateName);

    cy.expect([
      detailPane.find(Accordion('Template content')).exists(),
      detailPane.find(KeyValue('Email subject', { value: subject })).exists(),
      detailPane.find(Button('Preview')).exists(),
    ]);
    bodyTokens.forEach((token) => {
      cy.expect(detailPane.find(KeyValue('Email body', { value: including(token) })).exists());
    });
  },

  openActionsMenu(templateName) {
    cy.do(Pane(templateName).find(actionsButton).click());
  },

  verifyActionsMenu(actions) {
    actions.forEach((action) => {
      cy.expect(DropdownMenu().find(Button(action)).exists());
    });
  },
};
