-- Fix: trigger kredit user baru gagal karena nama tabel tanpa schema "public."
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_plan (user_id, plan_id, billing_anchor_day)
  VALUES (NEW.id, 'free', 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_credits (user_id, ai_chat_daily_remaining, skill_run_monthly_remaining)
  VALUES (NEW.id, 5, 10)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
