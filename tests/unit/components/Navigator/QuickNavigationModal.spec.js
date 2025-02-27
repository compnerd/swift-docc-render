/**
 * This source file is part of the Swift.org open source project
 *
 * Copyright (c) 2022-2023 Apple Inc. and the Swift project authors
 * Licensed under Apache License v2.0 with Runtime Library Exception
 *
 * See https://swift.org/LICENSE.txt for license information
 * See https://swift.org/CONTRIBUTORS.txt for Swift project authors
*/

import { shallowMount } from '@vue/test-utils';
import { fetchDataForPreview } from '@/utils/data';
import FilterInput from '@/components/Filter/FilterInput.vue';
import TopicTypeIcon from '@/components/TopicTypeIcon.vue';
import QuickNavigationHighlighter from '@/components/Navigator/QuickNavigationHighlighter.vue';
import QuickNavigationModal from '@/components/Navigator/QuickNavigationModal.vue';
import QuickNavigationPreview from '@/components/Navigator/QuickNavigationPreview.vue';
import Reference from '@/components/ContentNode/Reference.vue';
import { SCROLL_LOCK_DISABLE_ATTR } from '@/utils/scroll-lock';
import { flushPromises } from '../../../../test-utils';

jest.mock('@/utils/data');

describe('QuickNavigationModal', () => {
  let wrapper;

  const inputValue = 'foo';
  const nonResultsInputValue = 'xyz';
  const mocks = {
    $bridge: {
      on: jest.fn(),
      off: jest.fn(),
      send: jest.fn(),
    },
    $route: {
      path: '/documentation/somepath',
    },
    $router: {
      push: jest.fn(),
    },
    $refs: {
      match: {
        scrollIntoView: jest.fn(),
      },
    },
  };
  const symbols = [
    {
      uid: 0,
      title: 'foo',
      path: '/foo',
      type: 'protocol',
    },
    {
      uid: 1,
      title: 'fobaro',
      path: '/foo/bar/foobar/fobaro',
      type: 'method',
    },
    {
      uid: 2,
      title: 'bar',
      path: '/foo/bar',
      type: 'init',
    },
    {
      uid: 3,
      title: 'barfbarobarobar',
      path: '/barfbarobarobar',
      type: 'init',
    },
  ];
  const filteredSymbols = [
    symbols[0],
    symbols[1],
    symbols[3],
  ];
  const symbolsMatchBlueprint = [
    {
      input: inputValue,
      title: symbols[0].title,
      subMatchString: 'foo',
    },
    {
      input: inputValue,
      title: symbols[1].title,
      subMatchString: 'fobaro',
    },
    {
      input: inputValue,
      title: symbols[2].title,
      subMatchString: '',
    },
    {
      input: inputValue,
      title: symbols[3].title,
      subMatchString: 'fbarobaro',
    },
  ];
  const config = {
    mocks,
    propsData: {
      children: symbols,
      showQuickNavigationModal: true,
      technology: 'FoobarKit',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = shallowMount(QuickNavigationModal, config);
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it('it renders the Quick navigation modal', () => {
    expect(wrapper.find('.quick-navigation').exists()).toBe(true);
  });

  it('add the focus class on container if filter input is focused', () => {
    wrapper.find(FilterInput).vm.$emit('focus');
    expect(wrapper.find('.quick-navigation__container.focus').exists()).toBe(true);
  });

  it('removes the focus class on container if filter input is blur', () => {
    wrapper.find(FilterInput).vm.$emit('blur');
    expect(wrapper.find('.quick-navigation__container.focus').exists()).toBe(false);
  });

  it('it filters the symbols according to debouncedInput value', async () => {
    wrapper.setData({
      debouncedInput: inputValue,
    });
    await wrapper.vm.$nextTick();
    const matches = wrapper.vm.filteredSymbols;
    expect(matches).toHaveLength(filteredSymbols.length);
    expect(matches[0]).toMatchObject(filteredSymbols[0]);
    expect(matches[1]).toMatchObject(filteredSymbols[1]);
    expect(wrapper.findAll(QuickNavigationHighlighter).length).toBe(filteredSymbols.length);
  });

  it('it renders the filter input', () => {
    expect(wrapper.find('.quick-navigation__filter').exists()).toBe(true);
    const filter = wrapper.find(FilterInput);
    expect(filter.props()).toEqual({
      placeholder: 'filter.search-symbols FoobarKit',
      focusInputWhenCreated: true,
      focusInputWhenEmpty: true,
      positionReversed: false,
      preventBorderStyle: true,
      disabled: false,
      value: '',
      preventedBlur: false,
      selectedTags: [],
      shouldTruncateTags: false,
      tags: [],
      translatableTags: [],
      selectInputOnFocus: true,
      clearFilterOnTagSelect: true,
    });
  });

  it('it renders the match list on user input', async () => {
    wrapper.setData({
      debouncedInput: inputValue,
    });
    expect(wrapper.vm.debouncedInput).toBe(inputValue);
    expect(wrapper.findAll('.quick-navigation__symbol-match').length).toBe(filteredSymbols.length);
    expect(wrapper.find('.no-results').exists()).toBe(false);
    expect(wrapper.find('.quick-navigation__refs').attributes(SCROLL_LOCK_DISABLE_ATTR)).toBeTruthy();
  });

  it('it renders the `no results found` string when no symbols are found given an input', () => {
    wrapper.setData({
      debouncedInput: nonResultsInputValue,
    });
    const noResultsWrapper = wrapper.find('.no-results');
    expect(wrapper.vm.debouncedInput).toBe(nonResultsInputValue);
    expect(wrapper.findAll('.quick-navigation__symbol-match').length).toBe(0);
    expect(noResultsWrapper.exists()).toBe(true);
    expect(noResultsWrapper.text()).toBe('No results found.');
  });

  it('it renders symbol matches with the corresponding symbol icon', () => {
    wrapper.setData({
      debouncedInput: inputValue,
    });
    const matchWrapper = wrapper.findAll('.quick-navigation__symbol-match');
    expect(matchWrapper.at(0).find(TopicTypeIcon).exists()).toBe(true);
    expect(matchWrapper.at(1).find(TopicTypeIcon).exists()).toBe(true);
    expect(matchWrapper.at(0).find(TopicTypeIcon).props().type).toBe(filteredSymbols[0].type);
    expect(matchWrapper.at(1).find(TopicTypeIcon).props().type).toBe(filteredSymbols[1].type);
  });

  it('it renders a symbol match with the corresponding symbol title', () => {
    wrapper.setData({
      debouncedInput: inputValue,
    });
    const matchTitlesWrapper = wrapper.findAll('.symbol-title');
    expect(
      matchTitlesWrapper.at(0).text()
      + matchTitlesWrapper.at(0).find(QuickNavigationHighlighter).props().text
      + matchTitlesWrapper.at(0).find('span').text(),
    ).toBe(filteredSymbols[0].title);
    expect(
      matchTitlesWrapper.at(1).text()
      + matchTitlesWrapper.at(1).find(QuickNavigationHighlighter).props().text
      + matchTitlesWrapper.at(1).find('span').text(),
    ).toBe(filteredSymbols[1].title);
  });

  it('it redirects to the symbol path on symbol-match selection', async () => {
    wrapper.setData({
      debouncedInput: inputValue,
    });
    const referencesWrapper = wrapper.findAll(Reference);
    expect(referencesWrapper.at(0).props().url).toBe(filteredSymbols[0].path);
    expect(referencesWrapper.at(1).props().url).toBe(filteredSymbols[1].path);
  });

  it('it highlights the matching substring of the symbol title', async () => {
    wrapper.setData({
      debouncedInput: inputValue,
    });
    const matchTitlesWrapper = wrapper.findAll('.symbol-title');
    expect(
      matchTitlesWrapper.at(0).find(QuickNavigationHighlighter).props().matcherText,
    ).toBe(symbolsMatchBlueprint[0].input);
    expect(
      matchTitlesWrapper.at(0).find(QuickNavigationHighlighter).props().text,
    ).toBe(symbolsMatchBlueprint[0].subMatchString);
    expect(
      matchTitlesWrapper.at(1).find(QuickNavigationHighlighter).props().matcherText,
    ).toBe(symbolsMatchBlueprint[1].input);
    expect(
      matchTitlesWrapper.at(1).find(QuickNavigationHighlighter).props().text,
    ).toBe(symbolsMatchBlueprint[1].subMatchString);
    expect(
      matchTitlesWrapper.at(2).find(QuickNavigationHighlighter).props().matcherText,
    ).toBe(symbolsMatchBlueprint[3].input);
    expect(
      matchTitlesWrapper.at(2).find(QuickNavigationHighlighter).props().text,
    ).toBe(symbolsMatchBlueprint[3].subMatchString);
  });

  it('it debounces user input before filtering the symbols', () => {
    wrapper.setData({
      debouncedInput: inputValue,
    });
    expect(wrapper.vm.debouncedInput).toBe(inputValue);
    wrapper.setData({
      userInput: nonResultsInputValue,
    });
    expect(wrapper.vm.debouncedInput).toBe(inputValue);
  });

  it('it triggers new filtering on every debounce input change', () => {
    const fuzzyMatch = jest.spyOn(wrapper.vm, 'fuzzyMatch');
    wrapper.setData({
      debouncedInput: inputValue,
    });
    wrapper.setData({
      debouncedInput: nonResultsInputValue,
    });
    wrapper.setData({
      debouncedInput: inputValue,
    });
    wrapper.setData({
      debouncedInput: nonResultsInputValue,
    });
    expect(fuzzyMatch).toHaveBeenCalledTimes(4);
  });

  it('it matches the smallest matching substring from a symbol title', () => {
    const customSymbols = [
      {
        title: 'foofooxyzbarbar',
        path: '',
        type: '',
      },
    ];
    wrapper = shallowMount(QuickNavigationModal, {
      propsData: {
        children: customSymbols,
        showQuickNavigationModal: true,
        technology: 'Blah',
      },
    });
    wrapper.setData({
      debouncedInput: 'foobar',
    });
    expect(wrapper.find(QuickNavigationHighlighter).props().text).toBe('fooxyzbar');
  });

  it('it access a symbol on `enter` key', async () => {
    const handleKeyEnter = jest.spyOn(wrapper.vm, 'handleKeyEnter');
    wrapper.setData({
      debouncedInput: inputValue,
    });
    await wrapper.find('.quick-navigation').trigger('keydown.enter');
    wrapper.setData({
      debouncedInput: inputValue,
    });
    await wrapper.find(FilterInput).trigger('keydown.enter');
    expect(handleKeyEnter).toHaveBeenCalledTimes(2);
  });

  it('it renders the symbol tree of the resulting symbol', async () => {
    wrapper = shallowMount(QuickNavigationModal, {
      propsData: {
        children: [
          {
            title: 'bar',
            path: '/foo/bar',
            type: 'init',
            parents: [{
              parent: '<root>',
              title: 'foo',
            }],
          },
        ],
        showQuickNavigationModal: true,
        technology: 'Blah',
      },
    });
    wrapper.setData({
      debouncedInput: 'bar',
    });
    const symbolTree = wrapper
      .find('.quick-navigation__symbol-match')
      .find('.parent-path');
    expect(symbolTree.text()).toBe('bar');
  });

  it('it removes space characters from the debounced input string', () => {
    wrapper.setData({
      debouncedInput: 'bar foo',
    });
    expect(wrapper.vm.processedUserInput).toBe('barfoo');
  });
  it('it removes filtered symbols with duplicate paths', () => {
    const symbolsWithRepeatedPaths = [
      {
        title: 'foo',
        path: '/foo',
        type: 'method',
      },
      {
        title: 'foo',
        path: '/foo',
        type: 'method',
      },
      {
        title: 'foo',
        path: '/bar',
        type: 'method',
      },
    ];
    wrapper = shallowMount(QuickNavigationModal, {
      propsData: {
        children: symbolsWithRepeatedPaths,
        showQuickNavigationModal: true,
        technology: 'Blah',
      },
    });
    wrapper.setData({
      debouncedInput: 'foo',
    });
    expect(wrapper.vm.filteredSymbols.length).toBe(2);
  });

  describe('preview', () => {
    const { PreviewState } = QuickNavigationPreview.constants;

    it('renders with a default loading state', () => {
      wrapper.setData({ debouncedInput: inputValue });

      const preview = wrapper.find(QuickNavigationPreview);
      expect(preview.exists()).toBe(true);
      expect(preview.props('state')).toBe(PreviewState.loading);
      expect(preview.attributes(SCROLL_LOCK_DISABLE_ATTR)).toBeTruthy();
    });

    it('renders with a successful state and data when data is loaded', async () => {
      // simulate data fetching successfully
      const json = {
        abstract: [{ type: 'text', text: 'a' }],
        identifier: {
          interfaceLanguage: 'swift',
          url: 'doc://com.example.Test/foo',
        },
        kind: 'symbol',
        metadata: {
          role: 'symbol',
          title: 'Foo',
        },
      };
      fetchDataForPreview.mockResolvedValue(json);

      wrapper.setData({ debouncedInput: inputValue });
      await flushPromises();

      const preview = wrapper.find(QuickNavigationPreview);
      expect(preview.exists()).toBe(true);
      expect(preview.props('state')).toBe(PreviewState.success);
      expect(preview.props('json')).toBe(json);
    });

    it('renders with an error state when data fails to load', async () => {
      // simulate data fetching encountering error
      fetchDataForPreview.mockRejectedValue(new Error('!'));

      wrapper.setData({ debouncedInput: inputValue });
      await flushPromises();

      const preview = wrapper.find(QuickNavigationPreview);
      expect(preview.exists()).toBe(true);
      expect(preview.props('state')).toBe(PreviewState.error);
    });

    it('renders with a loading slowly state when data takes long to load', async () => {
      // there is probably a more realistic way to simulate the timeout but not
      // exactly sure how just yet, sorry
      wrapper.setData({
        debouncedInput: inputValue,
        previewIsLoadingSlowly: true,
      });

      const preview = wrapper.find(QuickNavigationPreview);
      expect(preview.exists()).toBe(true);
      expect(preview.props('state')).toBe(PreviewState.loadingSlowly);
    });

    it('does not render if no results were found', () => {
      wrapper.setData({ debouncedInput: nonResultsInputValue });

      expect(wrapper.contains(QuickNavigationPreview)).toBe(false);
    });
  });
});
