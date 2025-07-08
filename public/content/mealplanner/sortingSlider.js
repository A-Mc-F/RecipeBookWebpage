// Place this in a <script> tag or your JS file
document.addEventListener('DOMContentLoaded', function () {
    const sliders = document.querySelectorAll('.slider');
    sliders.forEach(slider => {
        const labels = slider.querySelectorAll('label');
        const bar = slider.querySelector('.slider-bar');
        const radios = slider.querySelectorAll('input[type="radio"]');

        function moveBar() {
            const checked = slider.querySelector('input[type="radio"]:checked');
            if (!checked) return;
            const label = slider.querySelector(`label[for="${checked.id}"]`);
            if (!label) return;
            const rect = label.getBoundingClientRect();
            const sliderRect = slider.getBoundingClientRect();
            bar.style.left = (label.offsetLeft) + 'px';
            bar.style.width = label.offsetWidth + 'px';
        }

        radios.forEach(radio => {
            radio.addEventListener('change', moveBar);
        });

        window.addEventListener('resize', moveBar);
        moveBar(); // Initial position
    });
});

// Show the slider only on the shopping list page
window.showSortSlider = function (show) {
    document.getElementById('slider').style.display = show ? '' : 'none';
};