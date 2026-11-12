import uuid from 'uuid';

import {
  Accordion,
  Button,
  KeyValue,
  NavListItem,
  Pane,
  including,
} from '../../../../../interactors';
import getRandomPostfix from '../../../utils/stringTools';

const EMAIL_TEMPLATES_SCOPE = 'orders-email';
const EMAIL_TEMPLATES_TITLE = 'Order email templates';

const ordersSettingsPane = Pane('Orders');
const emailTemplatesPane = Pane(EMAIL_TEMPLATES_TITLE);

const GENERAL_INFORMATION_ACCORDION = 'General information';
const TEMPLATE_CONTENT_ACCORDION = 'Template content';

export default {
  getDefaultOrderEmailTemplate({ additionalProperties = {} } = {}) {
    const postfix = getRandomPostfix();

    return {
      id: uuid(),
      active: true,
      description: `autotest_email_template_description_${postfix}`,
      localizedTemplates: {
        en: {
          header: `autotest_email_subject_${postfix}`,
          body: `<p>autotest_email_body_${postfix}</p>`,
        },
      },
      name: `autotest_email_template_${postfix}`,
      outputFormats: ['text/html'],
      scope: EMAIL_TEMPLATES_SCOPE,
      templateResolver: 'handlebars',
      ...additionalProperties,
    };
  },

  createOrderEmailTemplateViaApi(emailTemplate) {
    return cy
      .okapiRequest({
        method: 'POST',
        path: 'templates',
        body: emailTemplate,
        isDefaultSearchParamsRequired: false,
      })
      .then(({ body }) => body);
  },

  deleteOrderEmailTemplateViaApi(emailTemplateId, { failOnStatusCode = false } = {}) {
    return cy.okapiRequest({
      method: 'DELETE',
      path: `templates/${emailTemplateId}`,
      isDefaultSearchParamsRequired: false,
      failOnStatusCode,
    });
  },

  verifyOrdersSettingsGeneralOption() {
    cy.expect([
      ordersSettingsPane.exists(),
      ordersSettingsPane.find(NavListItem(EMAIL_TEMPLATES_TITLE)).exists(),
    ]);
  },

  waitLoading() {
    cy.expect(emailTemplatesPane.exists());
  },

  verifyNewButtonExists() {
    cy.expect(emailTemplatesPane.find(Button('New')).exists());
  },

  verifyTemplateListed(templateName) {
    cy.expect(emailTemplatesPane.find(NavListItem(templateName)).exists());
  },

  verifyTemplatesListed(templateNames) {
    templateNames.forEach((templateName) => this.verifyTemplateListed(templateName));
  },

  selectTemplate(templateName) {
    cy.do(emailTemplatesPane.find(NavListItem(templateName)).click());
    cy.expect(Pane(templateName).exists());
  },

  verifyTemplateDetailsPane(templateName) {
    const detailsPane = Pane(templateName);

    cy.expect([
      detailsPane.find(Button(including('Record last updated'))).exists(),
      detailsPane.find(Accordion(GENERAL_INFORMATION_ACCORDION)).exists(),
      detailsPane.find(Accordion(TEMPLATE_CONTENT_ACCORDION)).exists(),
    ]);
  },

  verifyGeneralInformation(templateName, { name, active, description }) {
    const generalInformation = Pane(templateName).find(Accordion(GENERAL_INFORMATION_ACCORDION));

    cy.do(generalInformation.expand());
    cy.expect([
      generalInformation.find(KeyValue('Template name')).has({ value: name }),
      generalInformation.find(KeyValue('Active')).has({ value: active }),
      generalInformation.find(KeyValue('Description')).has({ value: description }),
    ]);
  },

  verifyTemplateContent(templateName, { subject, body }) {
    const templateContent = Pane(templateName).find(Accordion(TEMPLATE_CONTENT_ACCORDION));

    cy.do(templateContent.expand());
    cy.expect([
      templateContent.find(KeyValue('Email subject')).has({ value: subject }),
      templateContent.has({ content: including('Email body') }),
      templateContent.has({ content: including(body) }),
      templateContent.find(Button('Preview')).exists(),
    ]);
  },
};
