import { ReSubstitute } from '../src/ReSubstitute';

jest.useFakeTimers();

describe('ReSubstitute', () => {
    const resub = new ReSubstitute();
    const resubBypass = new ReSubstitute(0, true);
    const resubThrottled = new ReSubstitute(500);

    test('should subscribe and be triggered correctly', () => {
        const onTriggerMock = jest.fn();

        resub.subscribe(onTriggerMock);
        resub.trigger();
        expect(onTriggerMock).toHaveBeenCalled();
    });

    test('should subscribe and be able to block triggers correctly', () => {
        const onTriggerMock = jest.fn();

        ReSubstitute.pushTriggerBlock();
        ReSubstitute.pushTriggerBlock();

        resub.subscribe(onTriggerMock);
        resub.trigger();
        expect(onTriggerMock).toHaveBeenCalledTimes(0);

        ReSubstitute.popTriggerBlock();
        expect(onTriggerMock).toHaveBeenCalledTimes(0);

        ReSubstitute.popTriggerBlock();
        expect(onTriggerMock).toHaveBeenCalledTimes(1);
    });

    test('should be able to bypass block correctly', () => {
        const onTriggerMock = jest.fn();
        const onBypassTriggerMock = jest.fn();

        ReSubstitute.pushTriggerBlock();

        resub.subscribe(onTriggerMock);
        resubBypass.subscribe(onBypassTriggerMock);
        resub.trigger();
        resubBypass.trigger();
        expect(onTriggerMock).toHaveBeenCalledTimes(0);
        expect(onBypassTriggerMock).toHaveBeenCalledTimes(1);

        ReSubstitute.popTriggerBlock();
        expect(onTriggerMock).toHaveBeenCalledTimes(1);
        expect(onBypassTriggerMock).toHaveBeenCalledTimes(1);
    });

    test('should subscribe and unsubscribe correctly', () => {
        const onTriggerMock = jest.fn();

        const subToken = resub.subscribe(onTriggerMock);
        resub.unsubscribe(subToken);
        resub.trigger();
        expect(onTriggerMock).toHaveBeenCalledTimes(0);
    });

    test('should subscribe by key and be triggered correctly', () => {
        const onTriggerMock = jest.fn();
        const onKeyTriggerMock = jest.fn();

        // Subscribe to all events
        resub.subscribe(onTriggerMock);
        // Subscribe only to key
        resub.subscribe(onKeyTriggerMock, 'testKey');

        resub.trigger();
        expect(onTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(0);
        resub.trigger('testKey');
        expect(onTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(1);
        resub.trigger(['testKey', ReSubstitute.Key_All]);
        expect(onTriggerMock).toHaveBeenCalledTimes(2);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(2);
    });

    test('should subscribe by multiple keys and be triggered correctly', () => {
        const onTriggerMock = jest.fn();
        const onKeyTriggerMock = jest.fn();
        const onKey2TriggerMock = jest.fn();
        const onKey3TriggerMock = jest.fn();

        // Subscribe to all events
        resub.subscribe(onTriggerMock);
        // Subscribe only to key
        resub.subscribe(onKeyTriggerMock, 'testKey');
        resub.subscribe(onKey2TriggerMock, 'testKey2');
        resub.subscribe(onKey3TriggerMock, 'testKey3');

        expect(onTriggerMock).toHaveBeenCalledTimes(0);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey2TriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey3TriggerMock).toHaveBeenCalledTimes(0);
        resub.trigger();
        expect(onTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey2TriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey3TriggerMock).toHaveBeenCalledTimes(0);
        resub.trigger(['testKey', 'testKey2']);
        expect(onTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKey2TriggerMock).toHaveBeenCalledTimes(1);
        expect(onKey3TriggerMock).toHaveBeenCalledTimes(0);
    });

    test('should subscribe by multiple keys and be able to delay triggers correctly', () => {
        const onTriggerMock = jest.fn();
        const onKeyTriggerMock = jest.fn();
        const onKey2TriggerMock = jest.fn();
        const onKey3TriggerMock = jest.fn();

        // Subscribe to all events
        resubThrottled.subscribe(onTriggerMock);
        // Subscribe only to key
        resubThrottled.subscribe(onKeyTriggerMock, 'testKey');
        resubThrottled.subscribe(onKey2TriggerMock, 'testKey2');
        resubThrottled.subscribe(onKey3TriggerMock, 'testKey3');

        expect(onTriggerMock).toHaveBeenCalledTimes(0);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey2TriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey3TriggerMock).toHaveBeenCalledTimes(0);
        resubThrottled.trigger();
        resubThrottled.trigger();
        expect(onTriggerMock).toHaveBeenCalledTimes(0);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey2TriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey3TriggerMock).toHaveBeenCalledTimes(0);

        jest.advanceTimersByTime(1000);
        expect(onTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey2TriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey3TriggerMock).toHaveBeenCalledTimes(0);

        resubThrottled.trigger(['testKey', 'testKey2']);
        resubThrottled.trigger(['testKey', 'testKey2']);
        expect(onTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey2TriggerMock).toHaveBeenCalledTimes(0);
        expect(onKey3TriggerMock).toHaveBeenCalledTimes(0);

        jest.advanceTimersByTime(1000);
        expect(onTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKey2TriggerMock).toHaveBeenCalledTimes(1);
        expect(onKey3TriggerMock).toHaveBeenCalledTimes(0);

        resubThrottled.trigger('testKey3');
        expect(onTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKey2TriggerMock).toHaveBeenCalledTimes(1);
        expect(onKey3TriggerMock).toHaveBeenCalledTimes(0);

        jest.advanceTimersByTime(1000);
        expect(onTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKeyTriggerMock).toHaveBeenCalledTimes(1);
        expect(onKey2TriggerMock).toHaveBeenCalledTimes(1);
        expect(onKey3TriggerMock).toHaveBeenCalledTimes(1);
    });
});
