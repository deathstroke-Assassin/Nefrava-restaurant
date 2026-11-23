import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export interface LocalizedText {
  en: string;
  ar: string;
  [language: string]: string | undefined;
}

const LANGUAGE_KEY = 'nefrava-language';
const THEME_KEY = 'nefrava-theme';

const arabic: Record<string, string> = {
  'Switch language': 'تغيير اللغة', 'Switch theme': 'تغيير المظهر', 'Open menu': 'افتح القائمة', 'Close menu': 'أغلق القائمة',
  'Home': 'الرئيسية', 'Categories': 'الفئات', 'Favorites': 'المفضلة', 'Cart': 'السلة',
  'Checkout': 'إتمام الطلب', 'Items': 'المنتجات', 'Orders': 'الطلبات', 'Dashboard': 'لوحة التحكم',
  'Log in': 'تسجيل الدخول', 'Log out': 'تسجيل الخروج', 'English': 'الإنجليزية', 'Arabic': 'العربية',
  'GROW WITH CONFIDENCE': 'ازرع بثقة', 'Everything your plants': 'كل ما تحتاجه نباتاتك',
  'need to thrive.': 'لتنمو وتزدهر.', 'Discover quality botanical supplies, tools, and essentials for every stage of your growing journey.': 'اكتشف مستلزمات وأدوات نباتية عالية الجودة لكل مرحلة من مراحل الزراعة.',
  'Explore categories ↓': 'استكشف الفئات ↓', 'EXPLORE OUR COLLECTION': 'اكتشف مجموعتنا',
  'Shop by category': 'تسوق حسب الفئة', 'categories': 'فئات', 'Growing your collection...': 'نجهز مجموعتك...',
  'We couldn’t load the categories. Please try again.': 'تعذر تحميل الفئات. يرجى المحاولة مرة أخرى.',
  'No categories yet. Check back soon!': 'لا توجد فئات بعد. تفضل بزيارتنا قريباً!',
  'Explore our collection.': 'اكتشف مجموعتنا.', 'Discover collection ↗': 'اكتشف المجموعة ↗',
  'GROW SOMETHING GOOD': 'ازرع شيئاً جميلاً', 'Our products': 'منتجاتنا', 'products': 'منتجات',
  'Loading products...': 'جارٍ تحميل المنتجات...', 'We couldn’t load the products. Please try again.': 'تعذر تحميل المنتجات. يرجى المحاولة مرة أخرى.',
  'No products available yet. Check back soon!': 'لا توجد منتجات حالياً. تفضل بزيارتنا قريباً!',
  'Other products': 'منتجات أخرى', 'View details →': 'عرض التفاصيل ←', '♡ Favorite': '♡ أضف للمفضلة', '♥ Saved': '♥ محفوظ', 'Add to cart': 'أضف إلى السلة',
  'Plant science supplies for every stage of your growing journey.': 'مستلزمات علوم النبات لكل مرحلة من مراحل الزراعة.',
  'Explore': 'استكشف', 'Order with confidence': 'اطلب بثقة',
  'We’ll call to confirm your order and arrange delivery. No online payment is required.': 'سنتصل بك لتأكيد طلبك وترتيب التوصيل. لا يلزم الدفع عبر الإنترنت.',
  'Made for people who love to grow.': 'صُنع لمحبي الزراعة.', 'Made for things that grow': 'صُنع لكل ما ينمو',
  '← Back to products': 'العودة إلى المنتجات ←', 'Loading item details...': 'جارٍ تحميل تفاصيل المنتج...',
  'Plant science supplies': 'مستلزمات علوم النبات',
  'About this item': 'عن هذا المنتج', 'No description available.': 'لا يوجد وصف متاح.',
  '♥ Remove from favorites': '♥ إزالة من المفضلة', '♡ Add to favorites': '♡ أضف إلى المفضلة',
  'View cart': 'عرض السلة', 'Place your order': 'أرسل طلبك',
  'Enter your details and we\'ll contact you by phone to confirm delivery.': 'أدخل بياناتك وسنتواصل معك هاتفياً لتأكيد التوصيل.',
  'Full name': 'الاسم الكامل', 'Phone number': 'رقم الهاتف', 'Email address (optional)': 'البريد الإلكتروني (اختياري)',
  'Delivery address': 'عنوان التوصيل', 'Quantity': 'الكمية', 'Order subtotal': 'المجموع الفرعي',
  'Submitting order...': 'جارٍ إرسال الطلب...', 'Submit order': 'إرسال الطلب',
  'Delivery and final order details will be confirmed by phone.': 'سيتم تأكيد تفاصيل الطلب والتوصيل عبر الهاتف.',
  'YOUR COLLECTION': 'مجموعتك', 'Your saved plant science supplies, ready when you are.': 'مستلزماتك النباتية المحفوظة جاهزة عندما تحتاجها.',
  'No favorites yet': 'لا توجد مفضلات بعد', 'Save items from the shop and they will appear here.': 'احفظ المنتجات من المتجر وستظهر هنا.',
  'Explore the shop': 'استكشف المتجر', 'Remove': 'إزالة', 'YOUR SELECTION': 'اختياراتك',
  'Shopping cart': 'سلة التسوق', 'We will confirm your order and delivery details by phone. No online payment is needed.': 'سنؤكد طلبك وتفاصيل التوصيل عبر الهاتف. لا يلزم الدفع عبر الإنترنت.',
  'Your cart is empty': 'سلتك فارغة', 'Explore the shop and add items to your order.': 'استكشف المتجر وأضف منتجات إلى طلبك.',
  'Continue to checkout': 'متابعة إلى إتمام الطلب', 'item(s)': 'منتج/منتجات',
  'each': 'للقطعة', 'product(s)': 'منتج/منتجات', 'unit(s)': 'وحدة',
  '← Back to cart': 'العودة إلى السلة ←', 'PHONE CONFIRMATION': 'التأكيد عبر الهاتف',
  'SECURE CHECKOUT': 'دفع آمن',
  'Pay securely through Stripe-hosted checkout, or choose cash on delivery.': 'ادفع بأمان عبر صفحة Stripe أو اختر الدفع عند الاستلام.',
  'Choose cash on delivery to place your order.': 'اختر الدفع عند الاستلام لإرسال طلبك.',
  'PAYMENT CONFIRMED': 'تم تأكيد الدفع', 'Thank you for your order': 'شكراً لطلبك',
  'Order reference:': 'رقم الطلب:', 'Amount paid:': 'المبلغ المدفوع:',
  'Payment method': 'طريقة الدفع', 'Cash on delivery': 'الدفع عند الاستلام',
  'Credit or debit card': 'بطاقة ائتمان أو خصم', 'Card payment demo (no charge)': 'تجربة الدفع بالبطاقة (بدون تحصيل)',
  'Continue to secure payment': 'المتابعة إلى الدفع الآمن', 'Payment information': 'معلومات الدفع',
  'Method:': 'الطريقة:', 'Payment status:': 'حالة الدفع:', 'Stripe session:': 'جلسة Stripe:',
  'Stripe hosted checkout': 'الدفع المستضاف عبر Stripe', 'Due on delivery': 'مستحق عند الاستلام',
  'Continue shopping': 'تابع التسوق',
  'Payment was cancelled. Your order and cart are still available; you can try again or choose cash on delivery.': 'تم إلغاء الدفع. لا يزال طلبك وسلتك محفوظين؛ يمكنك المحاولة مرة أخرى أو اختيار الدفع عند الاستلام.',
  'Verifying your payment with Stripe...': 'جارٍ التحقق من الدفع عبر Stripe...',
  'Card details are entered securely on Stripe and are never stored by this shop.': 'تُدخل بيانات البطاقة بأمان لدى Stripe ولا يحتفظ بها هذا المتجر.',
  'Demo checkout completed. No real payment was charged.': 'اكتملت تجربة الدفع. لم يتم تحصيل أي مبلغ حقيقي.',
  'Your payment is confirmed. We will contact you to arrange delivery.': 'تم تأكيد الدفع. سنتواصل معك لترتيب التوصيل.',
  'Payment is still pending. Your cart has been kept; refresh this page to check again.': 'لا يزال الدفع قيد الانتظار. احتفظنا بسلتك؛ حدّث الصفحة للتحقق مرة أخرى.',
  'This checkout session expired or failed. Your cart is still available. Please try again.': 'انتهت صلاحية جلسة الدفع أو فشلت. لا تزال سلتك محفوظة. يرجى المحاولة مرة أخرى.',
  'Could not verify the payment. Your cart has been kept.': 'تعذر التحقق من الدفع. احتفظنا بسلتك.',
  'Your order was submitted. Payment is due on delivery; we will call to confirm your order.': 'تم إرسال طلبك. الدفع عند الاستلام؛ سنتصل بك لتأكيد الطلب.',
  'There is no online payment. We will call you to confirm your order and delivery.': 'لا يوجد دفع عبر الإنترنت. سنتصل بك لتأكيد طلبك والتوصيل.',
  'Your details': 'بياناتك', 'Email address': 'البريد الإلكتروني',
  'Submitting order…': 'جارٍ إرسال الطلب...',
  'Place order': 'إرسال الطلب', 'We’ll call you to confirm the items and arrange delivery.': 'سنتصل بك لتأكيد المنتجات وترتيب التوصيل.',
  'Order summary': 'ملخص الطلب', 'Total': 'الإجمالي', 'Edit cart': 'تعديل السلة',
  'BOTANICA LAB / MANAGEMENT': 'بوتانيكا لاب / الإدارة', 'Manage customer requests and phone deliveries.': 'إدارة طلبات العملاء والتوصيل عبر الهاتف.',
  '↻ Refresh': '↻ تحديث', 'All orders': 'كل الطلبات', 'Open orders': 'الطلبات المفتوحة', 'Closed orders': 'الطلبات المغلقة',
  'Opened': 'مفتوح', 'Closed': 'مغلق', 'Loading orders...': 'جارٍ تحميل الطلبات...', 'No orders found': 'لا توجد طلبات',
  'Orders submitted by customers will appear here.': 'ستظهر طلبات العملاء هنا.', 'CUSTOMER': 'العميل', 'ITEMS': 'المنتجات',
  'TOTAL': 'الإجمالي', 'ORDER DETAILS': 'تفاصيل الطلب',
  'Customer information': 'بيانات العميل', 'Name:': 'الاسم:', 'Phone:': 'الهاتف:', 'Address:': 'العنوان:',
  'Placed:': 'تاريخ الطلب:', 'Purchased items': 'المنتجات المطلوبة', 'Order status': 'حالة الطلب',
  'Order notes': 'ملاحظات الطلب', 'No notes have been added.': 'لم تتم إضافة ملاحظات.', 'Add a note': 'أضف ملاحظة',
  'Add a call update or delivery detail...': 'أضف تحديثاً للمكالمة أو تفاصيل التوصيل...',
  'Cancel': 'إلغاء', 'Save changes': 'حفظ التغييرات', 'Saving...': 'جارٍ الحفظ...',
  'Email customer': 'إرسال بريد للعميل', 'No email address was provided with this order.': 'لم يتم إدخال بريد إلكتروني لهذا الطلب.',
  'Subject': 'الموضوع', 'Message': 'الرسالة', 'Write a message to the customer...': 'اكتب رسالة إلى العميل...',
  'Send email': 'إرسال البريد', 'Sending…': 'جارٍ الإرسال…',
  'STORE ORGANIZATION': 'تنظيم المتجر', 'Organize your botanical supplies into clear categories.': 'نظم مستلزماتك النباتية ضمن فئات واضحة.',
  '＋ Add category': '＋ أضف فئة', 'Total categories': 'إجمالي الفئات', 'Search results': 'نتائج البحث',
  'Your store\'s organization': 'تنظيم متجرك', 'Matching categories': 'الفئات المطابقة',
  'Your categories': 'فئاتك', 'Create and maintain your product categories.': 'أنشئ فئات منتجاتك وحدّثها.',
  'Search categories...': 'ابحث عن فئة...', 'Loading categories...': 'جارٍ تحميل الفئات...',
  'Category': 'الفئة', 'Description': 'الوصف', 'Last updated': 'آخر تحديث', 'Actions': 'الإجراءات',
  'No description': 'لا يوجد وصف', 'Edit': 'تعديل', 'Delete': 'حذف', 'No matching categories': 'لا توجد فئات مطابقة',
  'No categories yet': 'لا توجد فئات بعد', 'Try a different search term.': 'جرّب كلمة بحث أخرى.',
  'Create your first category to organize your inventory.': 'أنشئ أول فئة لتنظيم مخزونك.',
  'Add your first category': 'أضف أول فئة', 'Showing': 'عرض', 'of': 'من', 'category': 'فئة',
  'CATEGORY DETAILS': 'تفاصيل الفئة', 'Edit category': 'تعديل الفئة', 'Create a category': 'إنشاء فئة',
  'Give this category a clear name and description.': 'أدخل اسماً ووصفاً واضحين لهذه الفئة.', 'Category name *': 'اسم الفئة *',
  'Category description': 'وصف الفئة', 'Create category': 'إنشاء الفئة', 'Creating...': 'جارٍ الإنشاء...',
  'INVENTORY DETAILS': 'تفاصيل المخزون', 'Manage your plant science supplies, prices and stock.': 'إدارة مستلزمات علوم النبات والأسعار والمخزون.',
  '＋ Add item': '＋ أضف منتجاً', 'Total items': 'إجمالي المنتجات', 'Active items': 'المنتجات النشطة',
  'Low stock': 'مخزون منخفض', 'Across your inventory': 'في مخزونك', 'Available in your store': 'متاح في متجرك',
  'Fewer than 10 units': 'أقل من 10 وحدات', 'Your inventory': 'مخزونك', 'Review and update your listed items.': 'راجع منتجاتك وحدّثها.',
  'Search items...': 'ابحث عن منتج...', 'Loading items...': 'جارٍ تحميل المنتجات...',
  'No matching items': 'لا توجد منتجات مطابقة', 'Your inventory is empty': 'مخزونك فارغ',
  'Try another search term.': 'جرّب كلمة بحث أخرى.', 'Add your first item to get started.': 'أضف أول منتج للبدء.',
  'Add your first item': 'أضف أول منتج', 'INVENTORY': 'المخزون', 'ORGANIZATION': 'التنظيم', 'SALES': 'المبيعات',
  'ATTENTION': 'تنبيه', 'Item name *': 'اسم المنتج *', 'Name in English': 'الاسم بالإنجليزية', 'Name in Arabic': 'الاسم بالعربية',
  'Description in English': 'الوصف بالإنجليزية', 'Description in Arabic': 'الوصف بالعربية',
  'Item description': 'وصف المنتج', 'Price *': 'السعر *', 'Quantity *': 'الكمية *', 'Select a category': 'اختر فئة',
  'No categories found. Create a category before adding an item.': 'لم يتم العثور على فئات. أنشئ فئة قبل إضافة منتج.',
  'Item photo': 'صورة المنتج', 'Leave this empty to keep the existing photo when editing.': 'اتركه فارغاً للاحتفاظ بالصورة الحالية عند التعديل.',
  'Active item': 'منتج نشط', 'Allow this item to be available in the store.': 'السماح بعرض هذا المنتج في المتجر.',
  'Create item': 'إنشاء المنتج', 'Add a new item': 'إضافة منتج جديد', 'Fill in the details for your store inventory.': 'أدخل تفاصيل المنتج في مخزون متجرك.',
  'Active': 'نشط', 'Inactive': 'غير نشط', 'Uncategorized': 'بدون فئة',
  'Welcome back': 'مرحباً بعودتك', 'Sign in to your manager account.': 'سجّل الدخول إلى حساب المدير.',
  'Your workspace for everything that grows.': 'مساحة عملك لكل ما ينمو.',
  'Username': 'اسم المستخدم', 'Password': 'كلمة المرور', 'Signing in...': 'جارٍ تسجيل الدخول...',
  'Store overview': 'نظرة عامة على المتجر', 'Workspace': 'مساحة العمل', 'PLANT SCIENCE SUPPLIES': 'مستلزمات علوم النبات',
  'WORKSPACE': 'مساحة العمل', 'Growing something great?': 'هل تزرع شيئاً رائعاً؟',
  'Your next great harvest starts with the right supplies.': 'يبدأ حصادك القادم بالمستلزمات المناسبة.',
  'Management portal': 'بوابة الإدارة', 'YOUR STORE AT A GLANCE': 'لمحة سريعة عن متجرك',
  'Good things are': 'الأشياء الجميلة', 'growing.': 'تنمو.', 'Here\'s what\'s happening with your plant science supplies store.': 'إليك آخر المستجدات في متجر مستلزمات علوم النبات.',
  'Your essential numbers, all in one place.': 'أهم الأرقام في مكان واحد.', 'Live statistics': 'إحصاءات مباشرة',
  'Gathering your store statistics...': 'جارٍ جمع إحصاءات متجرك...', 'Couldn\'t load your statistics': 'تعذر تحميل الإحصاءات',
  'Try again': 'حاول مرة أخرى', 'Total Products': 'إجمالي المنتجات', 'Products in your catalog': 'المنتجات في الكتالوج',
  'Total Categories': 'إجمالي الفئات', 'Ways to organize your stock': 'طرق تنظيم مخزونك', 'Total Orders': 'إجمالي الطلبات',
  'Orders recorded in your store': 'الطلبات المسجلة في متجرك', 'Low Stock Products': 'منتجات منخفضة المخزون',
  'Products to check for restocking': 'منتجات تحتاج إلى إعادة تخزين', 'Store management': 'إدارة المتجر',
  'Manage your catalog and keep your store organized.': 'أدر كتالوجك وحافظ على تنظيم متجرك.',
  'View and manage your product categories.': 'عرض فئات منتجاتك وإدارتها.',
  'Add products, update prices, and manage stock.': 'أضف المنتجات وحدّث الأسعار وأدر المخزون.',
  'View customer orders and manage their status.': 'عرض طلبات العملاء وإدارة حالتها.',
  'A healthy store starts with healthy inventory.': 'المتجر الناجح يبدأ بمخزون جيد.',
  'Keep your catalog organized and monitor low-stock products to help your customers find what they need.': 'نظم كتالوجك وراقب المنتجات منخفضة المخزون لمساعدة عملائك في العثور على ما يحتاجونه.',
  'BACK TO SHOP': 'العودة إلى المتجر', 'Phone confirmation': 'التأكيد عبر الهاتف',
  'Email sent to': 'تم إرسال البريد إلى',
  'Enter an email subject and message.': 'أدخل موضوع البريد والرسالة.',
  'Could not send the email. Check Mailpit and try again.': 'تعذر إرسال البريد. تحقق من Mailpit وحاول مرة أخرى.',
  'This order has no customer email address': 'لا يوجد بريد إلكتروني للعميل في هذا الطلب.',
  'Order updated successfully.': 'تم تحديث الطلب بنجاح.', 'Could not load orders. Please try again.': 'تعذر تحميل الطلبات. حاول مرة أخرى.',
  'No order changes provided': 'لم يتم تقديم أي تغييرات للطلب.', 'Could not update the order.': 'تعذر تحديث الطلب.',
  'Please enter your name, phone number, and delivery address.': 'أدخل اسمك ورقم هاتفك وعنوان التوصيل.',
  'Please enter a valid phone number.': 'أدخل رقم هاتف صحيحاً.', 'Please enter a valid email address.': 'أدخل بريداً إلكترونياً صحيحاً.',
  'Your order was submitted. We will contact you by phone to confirm it and arrange delivery.': 'تم إرسال طلبك. سنتصل بك لتأكيده وترتيب التوصيل.',
  'Your order was submitted successfully! We will contact you by phone.': 'تم إرسال طلبك بنجاح! سنتواصل معك عبر الهاتف.',
  'Could not load items.': 'تعذر تحميل المنتجات.', 'Could not load categories.': 'تعذر تحميل الفئات.',
  'Enter a name, category, valid price and whole-number quantity.': 'أدخل اسماً وفئة وسعراً صحيحاً وكمية صحيحة.',
  'Could not save the item.': 'تعذر حفظ المنتج.', 'Could not save the category.': 'تعذر حفظ الفئة.',
  'Category name is required.': 'اسم الفئة مطلوب.', 'Item name is required.': 'اسم المنتج مطلوب.',
  'Please complete all customer details.': 'أكمل جميع بيانات العميل.', 'Quantity must be at least 1.': 'يجب أن تكون الكمية 1 على الأقل.',
  'Could not submit your order. Please try again.': 'تعذر إرسال طلبك. حاول مرة أخرى.',
  'Enter your username and password.': 'أدخل اسم المستخدم وكلمة المرور.', 'Sign-in failed.': 'فشل تسجيل الدخول.',
  'Invalid username or password.': 'اسم المستخدم أو كلمة المرور غير صحيحة.',
  'Unable to connect to the server.': 'تعذر الاتصال بالخادم.', 'Sign in': 'تسجيل الدخول',
  'Sign in to workspace': 'تسجيل الدخول إلى مساحة العمل',
  'Plant science, thoughtfully supplied.': 'مستلزمات علوم النبات بعناية.',
  'GROW · STUDY · DISCOVER': 'ازرع · ادرس · اكتشف', 'Every discovery': 'كل اكتشاف',
  'starts with a': 'يبدأ بـ', 'seed.': 'بذرة.', 'Tools for curious minds and the people growing tomorrow.': 'أدوات للعقول الفضولية ولمن يزرعون المستقبل.',
  'BOTANICAL RESEARCH & SUPPLIES': 'الأبحاث والمستلزمات النباتية',
  'Menu': 'قائمة الطعام', 'Events': 'الفعاليات', 'Our Story': 'قصتنا', 'Gallery': 'معرض الصور', 'Contact': 'اتصل بنا',
  'A TABLE BETWEEN THREE CULTURES': 'مائدة تجمع ثلاث ثقافات',
  'The Art of Tradition,': 'فن التقاليد،', 'Served with Elegance.': 'يُقدَّم بأناقة.',
  'Egyptian warmth, French finesse, and a little Russian soul — gathered around one table in Cairo.': 'دفء مصري، وأناقة فرنسية، ولمسة من الروح الروسية — تجتمع حول مائدة واحدة في القاهرة.',
  'Explore Our Menu': 'اكتشف قائمة الطعام', 'A generous table. A little ceremony. Always room for one more.': 'مائدة عامرة، وطقوس جميلة، ومكان دائماً لضيف جديد.',
  'FROM OUR KITCHEN': 'من مطبخنا', 'A menu with many homes': 'قائمة بطابع ثقافات متعددة', 'courses & traditions': 'أقسام من تقاليد مختلفة',
  'Preparing the menu…': 'نحضّر قائمة الطعام…', 'Our menu is being prepared. Please check back soon.': 'نحضّر قائمة الطعام. نرجو زيارتنا قريباً.',
  'All our table': 'كل أطباقنا', 'A LITTLE OF EVERYWHERE': 'نكهات من كل مكان', 'From our table': 'من مائدتنا', 'dishes & drinks': 'أطباق ومشروبات',
  'Our kitchen is setting the table…': 'مطبخنا يجهّز المائدة…', 'There are no dishes listed just now. Please return soon.': 'لا توجد أطباق معروضة الآن. تفضّل بزيارتنا قريباً.',
  'HOUSE FAVOURITE': 'من أطباقنا المفضلة', 'Currently unavailable': 'غير متاح حالياً', 'Other dishes': 'أطباق أخرى',
  'AT NEFRAVA': 'في نيفرافا', 'Good food makes': 'الطعام الشهي يجعل', 'an occasion of any evening.': 'كل مساء مناسبة جميلة.',
  'Seasonal suppers, long-table celebrations, and intimate gatherings are part of the way we host. Ask us about arranging a private table.': 'عشاء موسمي واحتفالات حول مائدة طويلة ولقاءات دافئة؛ هكذا نستقبلكم. اسألنا عن حجز مائدة خاصة.',
  'Plan an occasion': 'خطّط لمناسبتك', 'THREE INFLUENCES. ONE WELCOME.': 'ثلاثة روافد، وكرم ضيافة واحد.',
  'A place for the stories that happen over supper.': 'مكان للحكايات التي تولد حول العشاء.',
  'Nefrava brings the Egyptian table’s generous spirit into conversation with the quiet craft of a French bistro and the comfort of a Russian kitchen. We cook for lingering: another pour, another plate, another story.': 'تجمع نيفرافا كرم المائدة المصرية مع حرفة المطبخ الفرنسي الهادئة ودفء المطبخ الروسي. نطبخ لأمسيات تطول: كأس آخر، وطبق آخر، وحكاية جديدة.',
  'Meet us at the table': 'نلتقي حول المائدة', 'A GLIMPSE OF THE TABLE': 'لمحة عن مائدتنا', 'Made for staying awhile': 'أمسيات تستحق أن تطول',
  'COME AS YOU ARE': 'أهلاً بك كما أنت', 'We’ll set a place for you.': 'سنعدّ لك مكاناً على مائدتنا.',
  'Our Cairo address, phone, and social pages will be added here once confirmed. Send us a note in the meantime.': 'سنضيف عنواننا في القاهرة ورقم الهاتف وحسابات التواصل بعد تأكيدها. راسلنا حتى ذلك الحين.',
  'Address and phone to be announced · Cairo, Egypt': 'سيُعلن عن العنوان والهاتف قريباً · القاهرة، مصر',
  'Your name': 'اسمك', 'Your message': 'رسالتك', 'Send a note': 'أرسل رسالة',
  'Thank you. Your message has been sent.': 'شكراً لك. تم إرسال رسالتك.',
  'Please enter your name, a valid email, and a message.': 'أدخل اسمك وبريداً إلكترونياً صحيحاً ورسالة.',
  'We could not send your message. Please try again later.': 'تعذر إرسال رسالتك. حاول مرة أخرى لاحقاً.',
  'Nefrava crest in burgundy and antique gold': 'شعار نيفرافا بالنبيذي والذهبي العتيق',
  'Representative Nefrava dish': 'طبق من مطبخ نيفرافا', 'Representative dish photo from Nefrava': 'صورة تمثيلية لطبق من نيفرافا',
  'Your saved Nefrava dishes, ready when you are.': 'أطباق نيفرافا التي حفظتها، جاهزة حين ترغب.',
  'Save dishes from the menu and they will appear here.': 'احفظ أطباقاً من القائمة لتظهر هنا.', 'Explore the menu': 'اكتشف قائمة الطعام',
  'Your basket': 'سلتك', 'Your cart': 'سلتك', 'Review your selections before placing your order.': 'راجع اختياراتك قبل تأكيد الطلب.',
  'Discover the menu and add a dish to your order.': 'اكتشف قائمة الطعام وأضف طبقاً إلى سلتك.',
  'Add to basket': 'أضف إلى السلة', 'Review basket and choose payment': 'راجع السلة واختر طريقة الدفع',
  'Phone confirmation · pay on delivery': 'تأكيد عبر الهاتف · الدفع عند الاستلام',
  'The Art of Tradition, Served with Elegance.': 'فن التقاليد، يُقدَّم بأناقة.',
  'At your service': 'في خدمتك',
  'For a table, a celebration, or a question, send us a note. Our address and phone will be shared once confirmed.': 'لحجز مائدة أو مناسبة أو للاستفسار، أرسل لنا رسالة. سنعلن العنوان ورقم الهاتف بعد تأكيدهما.',
  '← Back to menu': 'العودة إلى قائمة الطعام ←', 'Loading dish details...': 'جارٍ تحميل تفاصيل الطبق...',
  'Return to shop': 'العودة إلى القائمة', 'NEFRAVA MENU': 'قائمة نيفرافا', 'About this dish': 'عن هذا الطبق',
  'Your basket is empty': 'سلتك فارغة',
  'Warmly lit dining room set for an evening meal': 'قاعة طعام مضاءة بدفء ومهيأة لعشاء مسائي',
  'A warmly lit restaurant dining room': 'قاعة مطعم مضاءة بدفء', 'A plated seasonal meal': 'طبق موسمي أنيق',
  'A candlelit table set for dinner': 'مائدة عشاء على ضوء الشموع', 'Restaurant links': 'روابط المطعم',
  'Item': 'الصنف', 'Unit price': 'سعر الوحدة', 'Subtotal': 'الإجمالي الفرعي', 'Action': 'الإجراء', 'Cart summary': 'ملخص السلة'
};

function readPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

@Injectable({ providedIn: 'root' })
export class SitePreferences {
  private readonly document = inject(DOCUMENT);
  readonly language = signal<Language>(readPreference(LANGUAGE_KEY, ['en', 'ar'], 'en'));
  readonly theme = signal<Theme>(readPreference(THEME_KEY, ['light', 'dark'], 'light'));

  constructor() {
    effect(() => {
      const language = this.language();
      const theme = this.theme();
      this.document.documentElement.lang = language;
      this.document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      this.document.documentElement.dataset['theme'] = theme;
      try {
        localStorage.setItem(LANGUAGE_KEY, language);
        localStorage.setItem(THEME_KEY, theme);
      } catch {
        // Keep preferences active for this page session if storage is unavailable.
      }
    });
  }

  toggleLanguage(): void { this.language.update(language => language === 'en' ? 'ar' : 'en'); }
  toggleTheme(): void { this.theme.update(theme => theme === 'light' ? 'dark' : 'light'); }

  translate(value: string | LocalizedText | null | undefined): string {
    const language = this.language();
    if (typeof value === 'string') {
      return language === 'ar' ? arabic[value] || value : value;
    }
    if (value && typeof value === 'object') {
      return value[language] || value.en || value.ar || '';
    }
    return '';
  }
}
