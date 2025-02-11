import './style.less';
import classNames from 'classnames';
import React, { Fragment, useLayoutEffect, useMemo, useRef, useState } from 'react';
import useOnClickOutside from 'use-onclickoutside';
import { groupByPropertyToDict } from '@itgenio/utils';
import { Checkbox } from '../checkbox';
import { SubtractFilledIcon, ChevronDownFilledIcon, ChevronUpFilledIcon, CheckmarkFilledIcon } from '../icons';
import { InputsContainer } from '../internal/components/inputsContainer';
import { generateId } from '../internal/utils/generateId';

type Sizes = 'small' | 'large';

type Value = string | number;

const DROPDOWN_PADDING = 20;

type Option = { label: string; value: Value; group?: string };

type GroupConfig = { hideText?: boolean; hideSeparator?: boolean };

export type MultiSelectProps = {
  size?: Sizes;
  label?: string;
  idQa?: string;
  className?: string;
  error?: boolean;
  focus?: boolean;
  hover?: boolean;
  disabled?: boolean;
  values?: Value[];
  helperText?: React.ReactNode;
  options?: Option[];
  onChange?: (selectedValues: Value[]) => void;
  selectAllOptionLabel?: string;
  hasSelectAllOption?: boolean;
  inputText?: string;
  renderValues?: (values: Value[]) => React.ReactNode;
  groupConfig?: GroupConfig;
  idQaForHelperText?: string;
};

export const MultiSelect = React.memo(
  ({
    size,
    label,
    idQa,
    className,
    focus,
    hover,
    disabled,
    error,
    values,
    options,
    helperText,
    onChange,
    selectAllOptionLabel,
    hasSelectAllOption,
    inputText,
    renderValues: renderValuesProp,
    groupConfig,
    idQaForHelperText,
  }: MultiSelectProps) => {
    const [open, setOpen] = useState(false);
    const hasValue = values.length > 0;

    const ref = useRef(null);
    const dropdownRef = useRef<HTMLUListElement>(null);
    const id = useMemo(() => generateId(), []);

    const canShowDropdown = open && !disabled;

    useOnClickOutside(ref, () => setOpen(false));

    useLayoutEffect(() => {
      if (!open) return;

      const dropdownElement = dropdownRef.current;

      if (!dropdownElement) return;

      const rect = dropdownElement.getBoundingClientRect();

      if (rect.right > window.innerWidth) {
        dropdownElement.style.left = `-${rect.right - window.innerWidth + DROPDOWN_PADDING}px`;
      }

      if (rect.bottom > window.innerHeight) {
        dropdownElement.style.top = `calc(100% - ${rect.bottom - window.innerHeight + DROPDOWN_PADDING}px)`;
      }
    }, [open]);

    const renderValues = () => {
      if (renderValuesProp) {
        return renderValuesProp(values);
      }

      return (
        <Fragment>
          {inputText}

          {hasValue && !disabled && <span className="multi-select-count">{values.length}</span>}
        </Fragment>
      );
    };

    const renderOptionItem = ({ label, value }: Option) => (
      <li
        id-qa={classNames({ [`${idQa}-option-${value}`]: idQa })}
        className={classNames('multi-select-option', size)}
        key={value}
        onChange={e => {
          e.stopPropagation();

          onChange(values.includes(value) ? values.filter(v => v !== value) : [...values, value]);
        }}
      >
        <Checkbox className="multi-select-checkbox" checked={values.includes(value)}>
          {label}
        </Checkbox>
      </li>
    );

    const renderOptionsByGroups = () => {
      const optionsByGroupDict = groupByPropertyToDict(
        options.filter(o => !!o.group),
        option => option.group
      );
      const optionsWithoutGroup = options.filter(o => !o.group);

      return [
        ...optionsWithoutGroup.map(renderOptionItem),
        ...Object.values(optionsByGroupDict).map((options, index, groupedOptions) => [
          <li className="gkit-multiselect-group" key={options[index].group}>
            {!groupConfig?.hideText && (
              <span className="text-xs gkit-multiselect-group-text">{options[index].group}</span>
            )}
          </li>,
          options.map(renderOptionItem),
          index !== groupedOptions.length - 1 && !groupConfig?.hideSeparator && (
            <li key={`${options[index].group}-separator`}>
              <div className="gkit-multiselect-separator" />
            </li>
          ),
        ]),
      ];
    };

    return (
      <InputsContainer
        {...{
          ref,
          id,
          idQa,
          size,
          label,
          helperText,
          error,
          idQaForHelperText,
          className: classNames('gkit-multi-select', className),
        }}
      >
        <div
          className={classNames('multi-select-content', size, {
            hover,
            focus: focus || canShowDropdown,
            error,
            disabled,
          })}
          onClick={e => {
            e.stopPropagation();

            setOpen(!open);
          }}
          id={id}
        >
          <div className={classNames('multi-select-label', size, { disabled, selected: hasValue })}>
            {renderValues()}
          </div>

          <div className="multi-select-chevron">
            {canShowDropdown ? <ChevronUpFilledIcon /> : <ChevronDownFilledIcon />}
          </div>
        </div>

        {canShowDropdown && (
          <ul ref={dropdownRef} id-qa={classNames({ [`${idQa}-dropdown`]: idQa })} className="multi-select-dropdown">
            {hasSelectAllOption && (
              <li
                id-qa={classNames({ [`${idQa}-option-select-all`]: idQa })}
                className={classNames('multi-select-option', size)}
                onClick={() => {
                  onChange(values.length === options.length ? [] : options.map(({ value }) => value));
                }}
              >
                <Checkbox
                  className="multi-select-checkbox"
                  checked={hasValue}
                  onChange={({ target: { checked } }) => {
                    onChange(!checked ? options.map(({ value }) => value) : []);
                  }}
                  icon={<SubtractFilledIcon />}
                  checkedIcon={values.length === options.length ? <CheckmarkFilledIcon /> : <SubtractFilledIcon />}
                >
                  {selectAllOptionLabel}
                </Checkbox>
              </li>
            )}

            {options.some(({ group }) => !!group) ? renderOptionsByGroups() : options.map(renderOptionItem)}
          </ul>
        )}
      </InputsContainer>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';
