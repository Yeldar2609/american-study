-- Corrections from the tuition/acceptance/endowment verification pass.
-- Each value below was re-checked against the school's official site / Wikipedia
-- and found to differ beyond tolerance from the round-1 backfill (overwhelmingly
-- stale or day-vs-boarding tuition). These OVERWRITE the value directly (unlike
-- the fill-only backfill 023), because they are confirmed corrections.

update public.schools set boarding_tuition_usd = 94800 where name = 'Forman School' and state = 'CT' and city = 'Litchfield';
update public.schools set boarding_tuition_usd = 19522 where name = 'New Mexico Military Institute' and state = 'NM' and city = 'Roswell';
update public.schools set boarding_tuition_usd = 102000 where name = 'Léman Manhattan Preparatory School' and state = 'NY' and city = 'New York City';
update public.schools set boarding_tuition_usd = 86700 where name = 'Dunn School' and state = 'CA' and city = 'Los Olivos';
update public.schools set boarding_tuition_usd = 73530 where name = 'Choate Rosemary Hall' and state = 'CT' and city = 'Wallingford';
update public.schools set boarding_tuition_usd = 77340 where name = 'The Loomis Chaffee School' and state = 'CT' and city = 'Windsor';
update public.schools set boarding_tuition_usd = 74600 where name = 'The Rectory School' and state = 'CT' and city = 'Pomfret';
update public.schools set boarding_tuition_usd = 61200 where name = 'Riverside Military Academy' and state = 'GA' and city = 'Gainesville';
update public.schools set boarding_tuition_usd = 37000 where name = 'St. Bede Academy' and state = 'IL' and city = 'Peru';
update public.schools set boarding_tuition_usd = 83560 where name = 'Walnut Hill School' and state = 'MA' and city = 'Natick';
update public.schools set boarding_tuition_usd = 82400 where name = 'Holderness School' and state = 'NH' and city = 'Holderness';
update public.schools set boarding_tuition_usd = 56900 where name = 'Armand Hammer United World College of the American West' and state = 'NM' and city = 'Montezuma';
update public.schools set boarding_tuition_usd = 88000 where name = 'Gow School' and state = 'NY' and city = 'South Wales';
update public.schools set boarding_tuition_usd = 89250 where name = 'Ross School' and state = 'NY' and city = 'East Hampton';
update public.schools set boarding_tuition_usd = 79500 where name = 'Vermont Academy' and state = 'VT' and city = 'Saxtons River';
update public.schools set boarding_tuition_usd = 78200 where name = 'Foxcroft School' and state = 'VA' and city = 'Middleburg';
