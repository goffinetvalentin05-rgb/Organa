BEGIN;

REVOKE SELECT ON TABLE public.documents FROM PUBLIC;
REVOKE SELECT ON TABLE public.documents FROM anon;
REVOKE SELECT ON TABLE public.documents FROM authenticated;

REVOKE SELECT ON TABLE public.shop_orders FROM PUBLIC;
REVOKE SELECT ON TABLE public.shop_orders FROM anon;
REVOKE SELECT ON TABLE public.shop_orders FROM authenticated;

REVOKE SELECT ON TABLE public.shop_order_items FROM PUBLIC;
REVOKE SELECT ON TABLE public.shop_order_items FROM anon;
REVOKE SELECT ON TABLE public.shop_order_items FROM authenticated;

COMMIT;
