import type { MdxDoc } from '../adapters/interface.js';

/**
 * MDX docs — v1.34-4 の doc set。 各 doc は 3 種類の block を混在させる
 * (prose Markdown + inline story preview + code sample)。 real Storybook 8
 * MDX の shape に合わせて、 block 順序と storyName は StoryMeta 側の title
 * / storyName と厳密に一致させる。
 *
 * 12 primitive doc + 1 form doc + 3 layout doc = 16 doc。 CoverageReporter は
 * doc の associatedStoryIds を元に「story x doc」 の cross reference を作り、
 * story 単位で「MDX 記述済」 boolean を出す。 renderMdx は storyTitle 経由で
 * StoryRegistry を look up する (docId / title は human-readable、 storyTitle
 * は StoryMeta.title と厳密一致する識別子)。
 */

export const buttonDoc: MdxDoc = {
  docId: 'DesignSystem/Button.mdx',
  title: 'Button',
  storyTitle: 'DesignSystem/Button',
  associatedStoryIds: ['designsystem-button--primary', 'designsystem-button--interactive'],
  blocks: [
    {
      kind: 'prose',
      text: 'The Button primitive is the standard clickable action affordance across the SaaS surface. It ships with 2 variants (primary / secondary) and is designed to be interruption-safe.',
    },
    { kind: 'preview', storyName: 'Primary' },
    {
      kind: 'prose',
      text: 'Use the primary variant for the single most important action per view. Fall back to secondary for lower-emphasis calls to action.',
    },
    {
      kind: 'code',
      language: 'tsx',
      source: '<Button variant="primary" label="Save" />',
    },
    { kind: 'preview', storyName: 'Interactive' },
  ],
};

export const inputDoc: MdxDoc = {
  docId: 'DesignSystem/Input.mdx',
  title: 'Input',
  storyTitle: 'DesignSystem/Input',
  associatedStoryIds: ['designsystem-input--empty', 'designsystem-input--typing'],
  blocks: [
    {
      kind: 'prose',
      text: 'Input renders a labelled text field. It wires the label[for] and input[id] automatically to satisfy the label-required a11y rule.',
    },
    { kind: 'preview', storyName: 'Empty' },
    {
      kind: 'code',
      language: 'tsx',
      source: '<Input id="email" label="Email" type="email" />',
    },
    { kind: 'preview', storyName: 'Typing' },
  ],
};

export const cardDoc: MdxDoc = {
  docId: 'DesignSystem/Card.mdx',
  title: 'Card',
  storyTitle: 'DesignSystem/Card',
  associatedStoryIds: ['designsystem-card--default', 'designsystem-card--elevated'],
  blocks: [
    {
      kind: 'prose',
      text: 'Card composes a heading + body region with an optional footer slot for actions.',
    },
    { kind: 'preview', storyName: 'Default' },
    { kind: 'preview', storyName: 'Elevated' },
    {
      kind: 'code',
      language: 'tsx',
      source: '<Card title="Analytics" body="Weekly report" variant="elevated" />',
    },
  ],
};

export const modalDoc: MdxDoc = {
  docId: 'DesignSystem/Modal.mdx',
  title: 'Modal',
  storyTitle: 'DesignSystem/Modal',
  associatedStoryIds: ['designsystem-modal--open', 'designsystem-modal--closable'],
  blocks: [
    {
      kind: 'prose',
      text: 'Modal implements the WAI-ARIA dialog pattern. The close button carries an aria-label so screen readers announce it correctly.',
    },
    { kind: 'preview', storyName: 'Open' },
    { kind: 'preview', storyName: 'Closable' },
  ],
};

export const dropdownDoc: MdxDoc = {
  docId: 'DesignSystem/Dropdown.mdx',
  title: 'Dropdown',
  storyTitle: 'DesignSystem/Dropdown',
  associatedStoryIds: ['designsystem-dropdown--default', 'designsystem-dropdown--change'],
  blocks: [
    {
      kind: 'prose',
      text: 'Dropdown wraps the native select element so we inherit keyboard behaviour and screen reader treatment for free.',
    },
    { kind: 'preview', storyName: 'Default' },
    { kind: 'preview', storyName: 'Change' },
  ],
};

export const tabsDoc: MdxDoc = {
  docId: 'DesignSystem/Tabs.mdx',
  title: 'Tabs',
  storyTitle: 'DesignSystem/Tabs',
  associatedStoryIds: ['designsystem-tabs--overviewactive', 'designsystem-tabs--switch'],
  blocks: [
    {
      kind: 'prose',
      text: 'Tabs uses role=tablist + role=tab + role=tabpanel to satisfy the WAI-ARIA tabpanel pattern.',
    },
    { kind: 'preview', storyName: 'OverviewActive' },
    { kind: 'preview', storyName: 'Switch' },
    {
      kind: 'code',
      language: 'tsx',
      source: '<Tabs activeId="usage" items={items} onSelect={handleSelect} />',
    },
  ],
};

export const toastDoc: MdxDoc = {
  docId: 'DesignSystem/Toast.mdx',
  title: 'Toast',
  storyTitle: 'DesignSystem/Toast',
  associatedStoryIds: ['designsystem-toast--success', 'designsystem-toast--error'],
  blocks: [
    {
      kind: 'prose',
      text: 'Toast uses aria-live=polite for informational levels and aria-live=assertive for errors.',
    },
    { kind: 'preview', storyName: 'Success' },
    { kind: 'preview', storyName: 'Error' },
  ],
};

export const tableDoc: MdxDoc = {
  docId: 'DesignSystem/Table.mdx',
  title: 'Table',
  storyTitle: 'DesignSystem/Table',
  associatedStoryIds: ['designsystem-table--withrows', 'designsystem-table--empty'],
  blocks: [
    {
      kind: 'prose',
      text: 'Table renders a semantic table with caption + thead + tbody. The empty state cell spans all columns.',
    },
    { kind: 'preview', storyName: 'WithRows' },
    { kind: 'preview', storyName: 'Empty' },
  ],
};

export const tooltipDoc: MdxDoc = {
  docId: 'DesignSystem/Tooltip.mdx',
  title: 'Tooltip',
  storyTitle: 'DesignSystem/Tooltip',
  associatedStoryIds: ['designsystem-tooltip--hidden', 'designsystem-tooltip--visible'],
  blocks: [
    {
      kind: 'prose',
      text: 'Tooltip wires aria-describedby between the anchor and the tip so screen readers announce the supplemental content.',
    },
    { kind: 'preview', storyName: 'Visible' },
  ],
};

export const badgeDoc: MdxDoc = {
  docId: 'DesignSystem/Badge.mdx',
  title: 'Badge',
  storyTitle: 'DesignSystem/Badge',
  associatedStoryIds: ['designsystem-badge--new', 'designsystem-badge--withcount'],
  blocks: [
    {
      kind: 'prose',
      text: 'Badge uses role=status so it participates in the aria-live region for optional counters.',
    },
    { kind: 'preview', storyName: 'New' },
    { kind: 'preview', storyName: 'WithCount' },
  ],
};

export const avatarDoc: MdxDoc = {
  docId: 'DesignSystem/Avatar.mdx',
  title: 'Avatar',
  storyTitle: 'DesignSystem/Avatar',
  associatedStoryIds: ['designsystem-avatar--initials', 'designsystem-avatar--online'],
  blocks: [
    {
      kind: 'prose',
      text: 'Avatar falls back to the extracted initials when no imageUrl is provided. Both variants carry aria-label with the full name.',
    },
    { kind: 'preview', storyName: 'Initials' },
    { kind: 'preview', storyName: 'Online' },
  ],
};

export const iconDoc: MdxDoc = {
  docId: 'DesignSystem/Icon.mdx',
  title: 'Icon',
  storyTitle: 'DesignSystem/Icon',
  associatedStoryIds: ['designsystem-icon--meaningful', 'designsystem-icon--decorative'],
  blocks: [
    {
      kind: 'prose',
      text: 'Icon flips between role=img (meaningful) and aria-hidden=true (decorative) based on the args.decorative flag.',
    },
    { kind: 'preview', storyName: 'Meaningful' },
    { kind: 'preview', storyName: 'Decorative' },
  ],
};

export const formDoc: MdxDoc = {
  docId: 'DesignSystem/Form.mdx',
  title: 'Form',
  storyTitle: 'DesignSystem/Form',
  associatedStoryIds: ['designsystem-form--empty', 'designsystem-form--submit'],
  blocks: [
    {
      kind: 'prose',
      text: 'Form composes multiple Input primitives + a submit button. Submit is a no-op when any required field is empty.',
    },
    { kind: 'preview', storyName: 'Empty' },
    { kind: 'preview', storyName: 'Submit' },
  ],
};

export const pageContainerDoc: MdxDoc = {
  docId: 'Layout/PageContainer.mdx',
  title: 'PageContainer',
  storyTitle: 'Layout/PageContainer',
  associatedStoryIds: ['layout-pagecontainer--default', 'layout-pagecontainer--nosubheading'],
  blocks: [
    {
      kind: 'prose',
      text: 'PageContainer establishes the top-level page shell — heading + optional subheading + main region.',
    },
    { kind: 'preview', storyName: 'Default' },
  ],
};

export const sectionRowDoc: MdxDoc = {
  docId: 'Layout/SectionRow.mdx',
  title: 'SectionRow',
  storyTitle: 'Layout/SectionRow',
  associatedStoryIds: ['layout-sectionrow--threecolumn', 'layout-sectionrow--twocolumn'],
  blocks: [
    {
      kind: 'prose',
      text: 'SectionRow renders an equal-width column grid. Column count is derived from args.columns.length.',
    },
    { kind: 'preview', storyName: 'ThreeColumn' },
    { kind: 'preview', storyName: 'TwoColumn' },
  ],
};

export const sidebarShellDoc: MdxDoc = {
  docId: 'Layout/SidebarShell.mdx',
  title: 'SidebarShell',
  storyTitle: 'Layout/SidebarShell',
  associatedStoryIds: ['layout-sidebarshell--introactive', 'layout-sidebarshell--setupactive'],
  blocks: [
    {
      kind: 'prose',
      text: 'SidebarShell composes a nav + main region. The active nav item carries aria-current=page.',
    },
    { kind: 'preview', storyName: 'IntroActive' },
    { kind: 'preview', storyName: 'SetupActive' },
  ],
};

export const ALL_DOCS: ReadonlyArray<MdxDoc> = [
  buttonDoc,
  inputDoc,
  cardDoc,
  modalDoc,
  dropdownDoc,
  tabsDoc,
  toastDoc,
  tableDoc,
  tooltipDoc,
  badgeDoc,
  avatarDoc,
  iconDoc,
  formDoc,
  pageContainerDoc,
  sectionRowDoc,
  sidebarShellDoc,
];

export function countDocs(): number {
  return ALL_DOCS.length;
}
