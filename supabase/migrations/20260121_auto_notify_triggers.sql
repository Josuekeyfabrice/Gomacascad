-- Trigger for new message notification
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
BEGIN
    SELECT full_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        NEW.receiver_id,
        'message',
        'Nouveau message',
        COALESCE(sender_name, 'Quelqu''un') || ': ' || LEFT(NEW.content, 50),
        jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id, 'product_id', NEW.product_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_on_message_notify
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_new_message();

-- Trigger for new call notification
CREATE OR REPLACE FUNCTION public.notify_on_new_call()
RETURNS TRIGGER AS $$
DECLARE
    caller_name TEXT;
BEGIN
    SELECT full_name INTO caller_name FROM public.profiles WHERE user_id = NEW.caller_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        NEW.receiver_id,
        'call',
        'Appel entrant',
        COALESCE(caller_name, 'Quelqu''un') || ' vous appelle',
        jsonb_build_object('call_id', NEW.id, 'caller_id', NEW.caller_id, 'call_type', NEW.call_type)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_on_call_notify
    AFTER INSERT ON public.calls
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_new_call();
