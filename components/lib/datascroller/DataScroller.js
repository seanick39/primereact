import React, { useRef, useState, forwardRef, useImperativeHandle, memo } from 'react';
import PropTypes from 'prop-types';
import { classNames, ObjectUtils } from '../utils/Utils';
import { localeOption } from '../api/Api';
import { useMountEffect, useUpdateEffect, useUnmountEffect } from '../hooks/Hooks';

export const DataScroller = memo(forwardRef((props, ref) => {
    const [dataToRenderState, setDataToRenderState] = useState([]);
    const value = useRef(props.value);
    const dataToRender = useRef([]);
    const first = useRef(0);
    const scrollFunction = useRef(null);
    const contentElement = useRef(null);

    const handleDataChange = () => {
        if (props.lazy) {
            dataToRender.current = value.current;
            setDataToRenderState([...dataToRender.current]);
        }
        else {
            load();
        }
    }

    const load = () => {
        if (props.lazy) {
            if (props.onLazyLoad) {
                props.onLazyLoad(createLazyLoadMetadata());
            }

            first.current += props.rows;
        }
        else {
            if (value.current) {
                for (let i = first.current; i < (first.current + props.rows); i++) {
                    if (i >= value.current.length) {
                        break;
                    }

                    dataToRender.current.push(value.current[i]);
                }

                if (value.current.length !== 0) {
                    first.current += props.rows;
                }

                setDataToRenderState([...dataToRender.current]);
            }
        }
    }

    const reset = () => {
        first.current = 0;
        dataToRender.current = [];
        setDataToRenderState([...dataToRender.current]);
        load();
    }

    const isEmpty = () => {
        return !dataToRender.current || (dataToRender.current.length === 0);
    }

    const createLazyLoadMetadata = () => {
        return {
            first: first.current,
            rows: props.rows
        };
    }

    const bindScrollListener = () => {
        if (props.inline) {
            scrollFunction.current = () => {
                let scrollTop = contentElement.current.scrollTop,
                    scrollHeight = contentElement.current.scrollHeight,
                    viewportHeight = contentElement.current.clientHeight;

                if ((scrollTop >= ((scrollHeight * props.buffer) - (viewportHeight)))) {
                    load();
                }
            }

            contentElement.current.addEventListener('scroll', scrollFunction.current);
        }
        else {
            scrollFunction.current = () => {
                let docBody = document.body,
                    docElement = document.documentElement,
                    scrollTop = (window.pageYOffset || document.documentElement.scrollTop),
                    winHeight = docElement.clientHeight,
                    docHeight = Math.max(docBody.scrollHeight, docBody.offsetHeight, winHeight, docElement.scrollHeight, docElement.offsetHeight);

                if (scrollTop >= ((docHeight * props.buffer) - winHeight)) {
                    load();
                }
            }

            window.addEventListener('scroll', scrollFunction.current);
        }
    }

    const unbindScrollListener = () => {
        if (scrollFunction.current) {
            if (props.inline && contentElement.current) {
                contentElement.current.removeEventListener('scroll', scrollFunction.current);
                contentElement.current = null;
            }
            else if (!props.loader) {
                window.removeEventListener('scroll', scrollFunction.current);
            }
        }

        scrollFunction.current = null;
    }

    useMountEffect(() => {
        load();

        if (!props.loader) {
            bindScrollListener();
        }
    });

    useUpdateEffect(() => {
        if (props.value) {
            value.current = props.value;

            first.current = 0;
            dataToRender.current = [];
            handleDataChange();
        }
    }, [props.value]);

    useUpdateEffect(() => {
        if (props.loader) {
            unbindScrollListener();
        }
    }, [props.loader]);

    useUnmountEffect(() => {
        if (scrollFunction.current) {
            unbindScrollListener();
        }
    });

    useImperativeHandle(ref, () => ({
        load,
        reset
    }));

    const useHeader = () => {
        if (props.header) {
            return <div className="p-datascroller-header">{props.header}</div>
        }

        return null;
    }

    const useFooter = () => {
        if (props.footer) {
            return <div className="p-datascroller-footer">{props.footer}</div>
        }

        return null;
    }

    const useItem = (_value, index) => {
        const content = props.itemTemplate ? props.itemTemplate(_value) : _value;

        return (
            <li key={index + '_datascrollitem'}>
                {content}
            </li>
        )
    }

    const useEmptyMessage = () => {
        const content = ObjectUtils.getJSXElement(props.emptyMessage, props) || localeOption('emptyMessage');

        return <li>{content}</li>
    }

    const useContent = () => {
        const content = ObjectUtils.isNotEmpty(dataToRenderState) ? dataToRenderState.map(useItem) : useEmptyMessage();

        return (
            <div ref={contentElement} className="p-datascroller-content" style={{ 'maxHeight': props.scrollHeight }}>
                <ul className="p-datascroller-list">
                    {content}
                </ul>
            </div>
        )
    }

    const className = classNames('p-datascroller p-component', props.className, {
        'p-datascroller-inline': props.inline
    });

    const header = useHeader();
    const footer = useFooter();
    const content = useContent();

    return (
        <div id={props.id} className={className}>
            {header}
            {content}
            {footer}
        </div>
    )
}));

DataScroller.defaultProps = {
    __TYPE: 'DataScroller',
    id: null,
    value: null,
    rows: 0,
    inline: false,
    scrollHeight: null,
    loader: false,
    buffer: 0.9,
    style: null,
    className: null,
    onLazyLoad: null,
    emptyMessage: null,
    itemTemplate: null,
    header: null,
    footer: null,
    lazy: false
}

DataScroller.propTypes = {
    __TYPE: PropTypes.string,
    id: PropTypes.string,
    value: PropTypes.array,
    rows: PropTypes.number,
    inline: PropTypes.bool,
    scrollHeight: PropTypes.string,
    loader: PropTypes.bool,
    buffer: PropTypes.number,
    style: PropTypes.object,
    className: PropTypes.string,
    onLazyLoad: PropTypes.func,
    emptyMessage: PropTypes.any,
    itemTemplate: PropTypes.func,
    header: PropTypes.any,
    footer: PropTypes.any,
    lazy: PropTypes.bool
}
